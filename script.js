// হিসাব ড্যাশবোর্ড ইন্টারঅ্যাকশন
// Card click -> redirect to target page (placeholder pages to be added later)

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.calc-card');
  cards.forEach(card => {
    const target = card.getAttribute('data-target');
    const activate = () => {
      // Redirect to target; pages can be implemented later
      window.location.href = target;
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });
});
