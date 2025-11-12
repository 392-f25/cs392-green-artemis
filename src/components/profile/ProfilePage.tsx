import type { FC } from 'react'

interface ProfilePageProps {
  initials: string
  displayName: string
  email?: string | null
  onSignOut: () => void
}

export const ProfilePage: FC<ProfilePageProps> = ({ initials, displayName, email, onSignOut }) => (
  <div className="profile-page">
    <div className="profile-card">
      <div className="profile-card__avatar" aria-hidden="true">{initials}</div>
      <h2 className="profile-card__name">{displayName}</h2>
      {email ? <p className="profile-card__email">{email}</p> : null}
    </div>
    <button type="button" className="profile-signout-button" onClick={onSignOut}>
      Sign Out
    </button>
  </div>
)
