'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  } | null;
}

export default function AdminTicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [ticketRes, agentsRes] = await Promise.all([
          fetch(`/api/admin/tickets/${resolvedParams.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/agents', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!ticketRes.ok || !agentsRes.ok) throw new Error('Failed to fetch data');

        const [ticketData, agentsData] = await Promise.all([
          ticketRes.json(),
          agentsRes.json()
        ]);

        setTicket(ticketData);
        setAgents(agentsData.agents);
        if (ticketData.assignedTo) {
          setSelectedAgent(ticketData.assignedTo.id);
        }
      } catch (err) {
        setError('Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/tickets/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');

      const updatedTicket = await res.json();
      setTicket(updatedTicket);
    } catch (err) {
      setError('Failed to update ticket status');
    }
  };

  const handleAssignAgent = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/tickets/${resolvedParams.id}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agentId: selectedAgent })
      });

      if (!res.ok) throw new Error('Failed to assign agent');

      const updatedTicket = await res.json();
      setTicket(updatedTicket);
    } catch (err) {
      setError('Failed to assign agent');
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!ticket) return <div className="text-center p-4">Ticket not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              <p className="mt-1 text-sm text-gray-500">Ticket #{ticket.id.slice(0, 8)}</p>
            </div>
            <div className="flex space-x-2">
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-gray-500">Created by</p>
              <p className="font-medium">{ticket.createdBy.name}</p>
              <p className="text-gray-500">{ticket.createdBy.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Created on</p>
              <p className="font-medium">{new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Last updated</p>
              <p className="font-medium">{new Date(ticket.updatedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Assigned to</p>
              <div className="flex items-center gap-2">
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignAgent}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to tickets
          </button>
        </div>
      </div>
    </div>
  );
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