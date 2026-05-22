import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export async function sendInviteEmail({ to_email, group_name, inviter_name, invite_url }) {
  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    { to_email, group_name, inviter_name, invite_url },
    PUBLIC_KEY
  );
}
