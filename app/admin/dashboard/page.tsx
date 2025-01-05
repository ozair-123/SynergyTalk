'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';


interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  urgentTickets: number;
  recentTickets: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    createdBy: { name: string };
    assignedTo?: { name: string } | null;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/stats', {
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

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!stats) return null;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard title="Total Tickets" value={stats.totalTickets} />
        <StatsCard title="Open" value={stats.openTickets} color="yellow" />
        <StatsCard title="In Progress" value={stats.inProgressTickets} color="blue" />
        <StatsCard title="Resolved" value={stats.resolvedTickets} color="green" />
        <StatsCard title="Closed" value={stats.closedTickets} color="gray" />
        <StatsCard title="Urgent" value={stats.urgentTickets} color="red" />
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Recent Tickets</h2>
            <Link href="/admin/tickets" className="text-indigo-600 hover:text-indigo-900">
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recentTickets.map((ticket) => (
            <Link 
              key={ticket.id}
              href={`/admin/tickets/${ticket.id}`}
              className="block hover:bg-gray-50"
            >
              <div className="px-4 py-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {ticket.title}
                  </p>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      By: {ticket.createdBy.name}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, color = 'blue' }: { title: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-sm font-medium text-gray-500 truncate">{title}</div>
      <div className={`mt-2 text-3xl font-semibold text-${color}-600`}>{value}</div>
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