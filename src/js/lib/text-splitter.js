/**
 * Custom Text Splitter (Characters / Words / Lines)
 * Generates overflow:hidden wrappers for editorial mask reveals.
 */

export function splitText(element, { type = 'chars' } = {}) {
  if (!element) return [];

  const text = element.textContent.trim();
  element.innerHTML = '';
  element.setAttribute('aria-label', text);

  const charElements = [];

  if (type === 'chars') {
    const words = text.split(' ');

    words.forEach((word, wIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'split-word';
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap';

      const letters = word.split('');
      letters.forEach((char) => {
        const charWrap = document.createElement('span');
        charWrap.className = 'split-char-wrap';
        charWrap.style.display = 'inline-block';
        charWrap.style.overflow = 'hidden';
        charWrap.style.verticalAlign = 'top';

        const charInner = document.createElement('span');
        charInner.className = 'split-char';
        charInner.textContent = char;
        charInner.style.display = 'inline-block';
        charInner.style.willChange = 'transform';

        charWrap.appendChild(charInner);
        wordSpan.appendChild(charWrap);
        charElements.push(charInner);
      });

      element.appendChild(wordSpan);

      // Add space between words
      if (wIdx < words.length - 1) {
        const space = document.createTextNode(' ');
        element.appendChild(space);
      }
    });
  }

  return charElements;
}
