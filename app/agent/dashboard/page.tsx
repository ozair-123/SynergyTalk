'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

interface DashboardStats {
  totalAssigned: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  recentTickets: Ticket[];
}

export default function AgentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/agent/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Failed to fetch statistics');

        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="text-center p-4">Loading dashboard...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agent Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Assigned</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {stats.totalAssigned}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Open</div>
          <div className="mt-2 text-3xl font-semibold text-yellow-600">
            {stats.openTickets}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">In Progress</div>
          <div className="mt-2 text-3xl font-semibold text-blue-600">
            {stats.inProgressTickets}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Resolved</div>
          <div className="mt-2 text-3xl font-semibold text-green-600">
            {stats.resolvedTickets}
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Assigned Tickets</h2>
            <Link
              href="/agent/tickets"
              className="text-indigo-600 hover:text-indigo-900"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentTickets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tickets assigned</p>
          ) : (
            stats.recentTickets.map((ticket) => (
              <div key={ticket.id} className="p-6 hover:bg-gray-50">
                <Link href={`/agent/tickets/${ticket.id}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600">
                        {ticket.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        From: {ticket.createdBy.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>Created on: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    'OPEN': 'bg-yellow-100 text-yellow-800',
    'IN_PROGRESS': 'bg-blue-100 text-blue-800',
    'RESOLVED': 'bg-green-100 text-green-800',
    'CLOSED': 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityColor(priority: string): string {
  const colors: { [key: string]: string } = {
    'LOW': 'bg-gray-100 text-gray-800',
    'MEDIUM': 'bg-blue-100 text-blue-800',
    'HIGH': 'bg-orange-100 text-orange-800',
    'URGENT': 'bg-red-100 text-red-800'
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}