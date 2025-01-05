'use client';
import { useEffect, useState, useCallback } from 'react';

interface TicketStatus {
  OPEN: string;
  IN_PROGRESS: string;
  RESOLVED: string;
  CLOSED: string;
  [key: string]: string; // Add index signature
 }
 
 interface TicketPriority {
  LOW: string;
  MEDIUM: string;
  HIGH: string;
  URGENT: string;
  [key: string]: string; // Add index signature  
 }
 
 const statusColors: TicketStatus = {
  'OPEN': 'bg-yellow-100 text-yellow-800',
  'IN_PROGRESS': 'bg-blue-100 text-blue-800',
  'RESOLVED': 'bg-green-100 text-green-800',
  'CLOSED': 'bg-gray-100 text-gray-800'
 };
 
 const priorityColors: TicketPriority = {
  'LOW': 'bg-gray-100 text-gray-800',
  'MEDIUM': 'bg-blue-100 text-blue-800',
  'HIGH': 'bg-orange-100 text-orange-800',
  'URGENT': 'bg-red-100 text-red-800'
 };
 
 function getStatusColor(status: string): string {
  return statusColors[status] || 'bg-gray-100 text-gray-800';
 }
 
 function getPriorityColor(priority: string): string {
  return priorityColors[priority] || 'bg-gray-100 text-gray-800';
 }

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  createdBy: { name: string };
}

type SortableField = 'createdAt' | 'title' | 'priority' | 'status';

export default function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortableField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filterAndSortTickets = useCallback(() => {
    let result = [...tickets];

    if (statusFilter !== 'ALL') {
      result = result.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      result = result.filter(ticket => ticket.priority === priorityFilter);
    }

    if (searchQuery) {
      result = result.filter(ticket => 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.createdBy.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return sortOrder === 'asc' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    setFilteredTickets(result);
  }, [tickets, statusFilter, priorityFilter, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/tickets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        setTickets(data.tickets);
        setFilteredTickets(data.tickets);
      } catch (error) {
        setError('Failed to load tickets');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    filterAndSortTickets();
  }, [filterAndSortTickets]);

  // Rest of the component remains the same...

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortableField)}
              className="flex-1 px-3 py-2 border rounded-md"
            >
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border rounded-md"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        {filteredTickets.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No tickets found</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <li key={ticket.id} className="hover:bg-gray-50">
                <a href={`/tickets/${ticket.id}`} className="block p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-indigo-600">{ticket.title}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>Created by: {ticket.createdBy.name}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

