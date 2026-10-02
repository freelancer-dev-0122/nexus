/**
 * Slot-Machine Odometer Digit Roll Counter
 * Renders vertical strips of 0-9 and animates translation with stagger.
 */
import gsap from 'gsap';

export class DigitRoller {
  constructor(containerEl) {
    this.container = containerEl;
    this.currentValue = '';
  }

  setValue(valueStr, duration = 1.2, staggerDelay = 0.04) {
    this.container.innerHTML = '';
    const chars = String(valueStr).split('');
    const strips = [];

    chars.forEach((char, index) => {
      const col = document.createElement('span');
      col.className = 'odometer-col';
      col.style.display = 'inline-block';
      col.style.overflow = 'hidden';
      col.style.height = '1.1em';
      col.style.verticalAlign = 'top';
      col.style.lineHeight = '1.1';

      if (/\d/.test(char)) {
        // Numeric digit: create 0-9 strip
        const targetDigit = parseInt(char, 10);
        const strip = document.createElement('span');
        strip.className = 'odometer-strip';
        strip.style.display = 'flex';
        strip.style.flexDirection = 'column';
        strip.style.willChange = 'transform';
        
        // Populate 0-9
        for (let i = 0; i <= 9; i++) {
          const d = document.createElement('span');
          d.textContent = i;
          d.style.height = '1.1em';
          d.style.display = 'block';
          strip.appendChild(d);
        }

        col.appendChild(strip);
        this.container.appendChild(col);

        strips.push({
          element: strip,
          targetDigit,
          index
        });
      } else {
        // Static symbol (comma, dot, %, s)
        const sym = document.createElement('span');
        sym.textContent = char;
        sym.style.display = 'inline-block';
        sym.style.height = '1.1em';
        col.appendChild(sym);
        this.container.appendChild(col);
      }
    });

    // Animate strips to their target digits
    strips.forEach((item) => {
      // Each digit is 10% of the 10-digit strip
      const targetPercent = item.targetDigit * 10;
      
      gsap.fromTo(
        item.element,
        { yPercent: 0 },
        {
          yPercent: -targetPercent,
          duration: duration + item.index * 0.05,
          delay: item.index * staggerDelay,
          ease: 'power4.out',
          overwrite: 'auto'
        }
      );
    });

    this.currentValue = valueStr;
  }
}

export function initDigitRollers() {
  const rollerMap = new Map();
  const rollEls = document.querySelectorAll('.digit-roll-wrapper');

  rollEls.forEach((el) => {
    const roller = new DigitRoller(el);
    const initialVal = el.getAttribute('aria-label') || el.textContent.trim();
    roller.setValue(initialVal, 1.4);
    rollerMap.set(el.id, roller);
  });

  return rollerMap;
}
