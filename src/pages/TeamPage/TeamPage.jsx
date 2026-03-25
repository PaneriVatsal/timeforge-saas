import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  UserPlus, 
  Mail, 
  Shield, 
  Clock, 
  MoreHorizontal, 
  Trash2, 
  CheckCircle2, 
  X,
  User,
  ShieldAlert
} from 'lucide-react';
import './TeamPage.css';

export default function TeamPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Employee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { profile, company, companyProfiles, invitations, inviteUser, cancelInvitation, removeMember } = useAuth();

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    const result = await inviteUser(inviteEmail, inviteRole);
    setIsSubmitting(false);
    
    if (result.success) {
      setInviteEmail('');
      setShowInviteModal(false);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleCancelInvite = async (invitationId) => {
    if (confirm('Are you sure you want to cancel this invitation?')) {
      await cancelInvitation(invitationId);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (confirm('Are you sure you want to remove this member? This will delete their access to the company.')) {
      await removeMember(memberId);
      setActiveDropdown(null);
    }
  };

  return (
    <div className="team-page animate-fade-in-up">
      <div className="page-header">
        <div>
          <h2>Team Management</h2>
          <p className="page-subtitle">Manage your company members and invitations</p>
        </div>
        <button className="btn btn-accent" onClick={() => setShowInviteModal(true)}>
          <UserPlus size={16} />
          Invite Member
        </button>
      </div>

      <div className="team-stats-grid">
        <div className="stat-card card">
          <span className="stat-label">Total Members</span>
          <span className="stat-value">{companyProfiles.length}</span>
        </div>
        <div className="stat-card card">
          <span className="stat-label">Pending Invites</span>
          <span className="stat-value">{invitations.filter(i => i.status === 'pending').length}</span>
        </div>
        <div className="stat-card card">
          <span className="stat-label">Admins</span>
          <span className="stat-value">{companyProfiles.filter(p => p.role === 'Admin').length}</span>
        </div>
      </div>

      <div className="team-content">
        <div className="section-header">
          <h3>Active Members</h3>
        </div>
        <div className="members-list card">
          {companyProfiles.map((member) => (
            <div key={member.id} className="member-item">
              <div className="member-info">
                <div className="member-avatar">
                  {member.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="member-name">
                    {member.full_name}
                    {member.id === profile.id && <span className="badge badge-neutral ml-2">You</span>}
                  </div>
                  <div className="member-role">
                    {member.role === 'Admin' ? <Shield size={12} className="text-accent" /> : <User size={12} />}
                    {member.role}
                  </div>
                </div>
              </div>
              <div className="member-actions">
                {profile.role === 'Admin' && member.id !== profile.id && (
                  <>
                    <button 
                      className={`btn btn-ghost btn-icon btn-sm ${activeDropdown === member.id ? 'active' : ''}`}
                      onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {activeDropdown === member.id && (
                      <div className="dropdown-menu">
                        <button 
                          className="dropdown-item text-danger"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 size={14} />
                          Remove Member
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {invitations.length > 0 && (
          <>
            <div className="section-header mt-8">
              <h3>Pending Invitations</h3>
            </div>
            <div className="members-list card">
              {invitations.map((invite) => (
                <div key={invite.id} className="member-item invitation-item">
                  <div className="member-info">
                    <div className="member-avatar invite-avatar">
                      <Mail size={16} />
                    </div>
                    <div>
                      <div className="member-name">{invite.email}</div>
                      <div className="member-role">
                         Invited as {invite.role}
                      </div>
                    </div>
                  </div>
                  <div className="invite-status">
                    <span className="badge badge-warning">Pending</span>
                    <button 
                      className="btn btn-ghost btn-icon btn-sm text-danger ml-2"
                      onClick={() => handleCancelInvite(invite.id)}
                      title="Cancel Invitation"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invite New Member</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowInviteModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleInvite} className="modal-form">
              {errorMessage && (
                <div className="alert alert-danger mb-4">
                  <ShieldAlert size={14} />
                  {errorMessage}
                </div>
              )}
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="input" 
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  className="input"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
                <div className="role-description">
                  {inviteRole === 'Admin' ? (
                    <p className="text-warning">
                      <ShieldAlert size={12} />
                      Admins can manage projects, see all reports, and invite others.
                    </p>
                  ) : (
                    <p>Standard users can track time and see their assigned projects.</p>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
