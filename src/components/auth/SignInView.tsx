import type { FC } from 'react'

interface SignInViewProps {
  onSignIn: () => void
}

export const SignInView: FC<SignInViewProps> = ({ onSignIn }) => (
  <div className="sign-in-shell">
    <div className="sign-in-content">
      <div>
        <h1 className="sign-in-title">Artemis</h1>
        <div className="sign-in-underline" aria-hidden="true" />
      </div>
      <p className="sign-in-subtitle"> Your Archery Progress Made Visible </p>
      <button className="sign-in-button" onClick={onSignIn}>
        Sign in With Google
      </button>
    </div>
  </div>
)
