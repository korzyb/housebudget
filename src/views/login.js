import { h, toast } from '../dom.js';
import { signIn, resetPassword } from '../supabase.js';
import { navigate } from '../router.js';

export function renderLogin() {
  let submitting = false;

  const emailInput = h('input', { class: 'input', type: 'email', name: 'email', placeholder: 'twoj@email.pl', autocomplete: 'email', required: true });
  const passInput = h('input', { class: 'input', type: 'password', name: 'password', placeholder: 'Hasło', autocomplete: 'current-password', required: true });
  const submitBtn = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Zaloguj się');

  const form = h('form', {
    onSubmit: async (e) => {
      e.preventDefault();
      if (submitting) return;
      submitting = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logowanie…';
      try {
        await signIn(emailInput.value.trim(), passInput.value);
        // onAuthStateChange w supabase.js zaktualizuje store → router przerenderuje
      } catch (err) {
        toast(err.message || 'Nie udało się zalogować', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Zaloguj się';
      } finally {
        submitting = false;
      }
    },
  }, [
    h('div', { class: 'field' }, [h('label', {}, 'E-mail'), emailInput]),
    h('div', { class: 'field' }, [h('label', {}, 'Hasło'), passInput]),
    submitBtn,
    h('button', {
      class: 'btn btn-ghost btn-block',
      type: 'button',
      onClick: async () => {
        const email = emailInput.value.trim();
        if (!email) { toast('Wpisz e-mail żeby zresetować hasło', 'error'); return; }
        try {
          await resetPassword(email);
          toast('Wysłaliśmy link do resetu hasła na ' + email, 'success', 5000);
        } catch (err) {
          toast(err.message || 'Nie udało się wysłać', 'error');
        }
      },
    }, 'Zapomniałem hasła'),
  ]);

  return h('div', { class: 'view auth-view' }, [
    h('div', { class: 'brand' }, [
      h('img', { src: './icons/icon.svg', alt: '' }),
      h('h1', {}, 'Home Budget'),
      h('p', {}, 'Twój domowy budżet w jednym miejscu'),
    ]),
    form,
    h('div', { class: 'switch' }, [
      'Nie masz konta? ',
      h('a', { href: '#/register', onClick: (e) => { e.preventDefault(); navigate('/register'); } }, 'Zarejestruj się'),
    ]),
  ]);
}
