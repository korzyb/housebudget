import { h, toast } from '../dom.js';
import { signUp } from '../supabase.js';
import { navigate } from '../router.js';

export function renderRegister() {
  let submitting = false;

  const nameInput = h('input', { class: 'input', type: 'text', name: 'name', placeholder: 'Twoje imię', required: true });
  const emailInput = h('input', { class: 'input', type: 'email', name: 'email', placeholder: 'twoj@email.pl', autocomplete: 'email', required: true });
  const passInput = h('input', { class: 'input', type: 'password', name: 'password', placeholder: 'Hasło (min. 6 znaków)', autocomplete: 'new-password', minlength: '6', required: true });
  const pass2Input = h('input', { class: 'input', type: 'password', name: 'password2', placeholder: 'Powtórz hasło', autocomplete: 'new-password', minlength: '6', required: true });
  const submitBtn = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Utwórz konto');

  const form = h('form', {
    onSubmit: async (e) => {
      e.preventDefault();
      if (submitting) return;
      if (passInput.value !== pass2Input.value) {
        toast('Hasła nie są identyczne', 'error');
        return;
      }
      submitting = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Tworzenie konta…';
      try {
        await signUp(emailInput.value.trim(), passInput.value, nameInput.value.trim());
        toast('Konto utworzone. Zaloguj się.', 'success', 5000);
        navigate('/login');
      } catch (err) {
        toast(err.message || 'Nie udało się zarejestrować', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Utwórz konto';
      } finally {
        submitting = false;
      }
    },
  }, [
    h('div', { class: 'field' }, [h('label', {}, 'Imię'), nameInput]),
    h('div', { class: 'field' }, [h('label', {}, 'E-mail'), emailInput]),
    h('div', { class: 'field' }, [h('label', {}, 'Hasło'), passInput]),
    h('div', { class: 'field' }, [h('label', {}, 'Powtórz hasło'), pass2Input]),
    submitBtn,
  ]);

  return h('div', { class: 'view auth-view' }, [
    h('div', { class: 'brand' }, [
      h('img', { src: './icons/icon.svg', alt: '' }),
      h('h1', {}, 'Załóż konto'),
      h('p', {}, 'Po rejestracji potwierdź adres e-mail, jeśli Supabase tego wymaga.'),
    ]),
    form,
    h('div', { class: 'switch' }, [
      'Masz już konto? ',
      h('a', { href: '#/login', onClick: (e) => { e.preventDefault(); navigate('/login'); } }, 'Zaloguj się'),
    ]),
  ]);
}
