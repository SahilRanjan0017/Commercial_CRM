import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <form>
      <input name="full_name" type="text" placeholder="Full Name" />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />

      <button formAction={signup}>Sign Up</button>
      <button formAction={login}>Log In</button>
    </form>
  )
}
