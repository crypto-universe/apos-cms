export default () => {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.faq__guest').forEach(item => {
      item.addEventListener('click', () => {
        const faqItem = item.parentElement;
        const faqAnswer = faqItem.querySelector('.faq__answer');
        if (faqAnswer.style.display === 'none' || !faqAnswer.style.display) {
          faqAnswer.style.display = 'block';
        } else {
          faqAnswer.style.display = 'none';
        }
      });
    });
  });
};
