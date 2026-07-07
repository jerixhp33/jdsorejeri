'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, Shield, UserX, UserCheck } from 'lucide-react';
import { formatDate, formatRelativeTime, getInitials, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { UserProfile, UserRole } from '@/types';

interface AdminUsersViewProps {
  users: UserProfile[];
  activeUserIds: Set<string>;
}

export function AdminUsersView({ users: initialUsers, activeUserIds }: AdminUsersViewProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const updateRole = async (userId: string, role: UserRole) => {
    setUpdatingId(userId);
    const res = await fetch('/api/admin/users', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: userId, role }) }); const resData = await res.json(); const error = res.ok ? null : resData;
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success(`Role updated to ${role}`);
    } else {
      toast.error('Failed to update role');
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-white">Users</h1>
        <div className="flex items-center gap-3">
          <span className="badge-luxe">{users.length} total</span>
          <span className="badge-gold">{activeUserIds.size} active this week</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-luxe pl-9 text-sm w-full"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'user', 'admin', 'super_admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                roleFilter === r
                  ? 'bg-luxe-accent text-black'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              )}
            >
              {r === 'all' ? 'All Roles' : r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['User', 'Email', 'Role', 'Status', 'Joined', 'Last Active', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-white/40 text-xs uppercase tracking-wide font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-white/30 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.profile_picture ? (
                          <Image
                            src={user.profile_picture}
                            alt={user.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-luxe-accent/20 flex items-center justify-center">
                            <span className="text-luxe-accent text-xs font-bold">
                              {getInitials(user.name)}
                            </span>
                          </div>
                        )}
                        <span className="text-white text-sm font-medium">{user.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3">
                      <span className="text-white/60 text-sm">{user.email}</span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'badge-luxe text-xs capitalize',
                          user.role === 'super_admin' && '!bg-luxe-accent/20 !text-luxe-accent !border-luxe-accent/30',
                          user.role === 'admin' && '!bg-blue-500/20 !text-blue-400 !border-blue-500/30'
                        )}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'badge-luxe text-xs',
                          activeUserIds.has(user.id)
                            ? '!bg-green-500/20 !text-green-400 !border-green-500/30'
                            : '!bg-white/5 !text-white/30'
                        )}
                      >
                        {activeUserIds.has(user.id) ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3">
                      <span className="text-white/50 text-xs">{formatDate(user.created_at)}</span>
                    </td>

                    {/* Last Active */}
                    <td className="px-4 py-3">
                      <span className="text-white/50 text-xs">
                        {user.last_active ? formatRelativeTime(user.last_active) : 'Never'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.role === 'user' && (
                          <button
                            onClick={() => updateRole(user.id, 'admin')}
                            disabled={updatingId === user.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition-all disabled:opacity-50"
                            title="Make admin"
                          >
                            <Shield className="w-3 h-3" />
                            Make Admin
                          </button>
                        )}
                        {user.role === 'admin' && (
                          <button
                            onClick={() => updateRole(user.id, 'user')}
                            disabled={updatingId === user.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 transition-all disabled:opacity-50"
                            title="Remove admin"
                          >
                            <UserX className="w-3 h-3" />
                            Remove Admin
                          </button>
                        )}
                        {user.role === 'super_admin' && (
                          <span className="text-luxe-accent/60 text-xs">Super Admin</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
