document.addEventListener('DOMContentLoaded', () => {
  const enterButton = document.getElementById('enter-btn');
  const prototypeScreen = document.querySelector('.prototype-screen');

  enterButton.addEventListener('click', () => {
    prototypeScreen.style.display = 'none';
  });
});