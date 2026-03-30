'use client'

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader,
  StatCard,
  Modal,
  EmptyState,
  Spinner,
} from '@/components/shared';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle,
  FileText,
  MessageCircle,
  Send,
  Pill,
  Sparkles,
} from 'lucide-react';
import { cn, timeAgo } from '@/utils';
import toast from 'react-hot-toast';

export function DoctorDashboard() {
  const qc = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [todayString, setTodayString] = useState('');

  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [notes, setNotes] = useState({
    diagnosis: '',
    treatment: '',
    doctorNotes: '',
  });

  const [prescribeOpen, setPrescribeOpen] = useState(false);
  const [rxForm, setRxForm] = useState({
    drugs: [
      {
        drugName: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: 1,
      },
    ],
    notes: '',
  });

  const [aiDiagnosis, setAiDiagnosis] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTodayString(new Date().toDateString());
  }, []);

  const { data: consultations, isLoading } = useQuery({
    queryKey: ['doctor-consultations'],
    queryFn: async () => {
      const res = await fetch('/api/consultations?limit=20');
      return (await res.json()).data || [];
    },
    refetchInterval: activeConsultation ? 5000 : 30000,
  });

  const stats = useMemo(() => {
    if (!consultations) {
      return {
        pending: 0,
        inProgress: 0,
        completed: 0,
        today: 0,
      };
    }

    return {
      pending: consultations.filter((c: any) => c.status === 'pending').length,
      inProgress: consultations.filter(
        (c: any) => c.status === 'in_progress'
      ).length,
      completed: consultations.filter(
        (c: any) => c.status === 'completed'
      ).length,
      today: mounted
        ? consultations.filter(
            (c: any) =>
              new Date(c.createdAt).toDateString() === todayString
          ).length
        : 0,
    };
  }, [consultations, mounted, todayString]);

  const acceptConsultation = async (id: string) => {
    const res = await fetch(`/api/consultations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' }),
    });

    const data = await res.json();

    if (data.success) {
      setActiveConsultation(data.data);
      qc.invalidateQueries({ queryKey: ['doctor-consultations'] });
      toast.success('Consultation accepted');
    }
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeConsultation || sending) return;

    const content = msgInput;
    setMsgInput('');
    setSending(true);

    try {
      const res = await fetch(
        `/api/consultations/${activeConsultation._id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: { content, type: 'text' },
          }),
        }
      );

      const data = await res.json();

      if (data.success) setActiveConsultation(data.data);
    } catch {
      toast.error('Failed');
    } finally {
      setSending(false);
    }
  };

  const saveNotes = async () => {
    if (!activeConsultation) return;

    const res = await fetch(
      `/api/consultations/${activeConsultation._id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notes),
      }
    );

    const data = await res.json();

    if (data.success) {
      setActiveConsultation(data.data);
      toast.success('Notes saved');
    }
  };

  const issuePrescription = async () => {
    if (!activeConsultation) return;

    const validDrugs = rxForm.drugs.filter((d) => d.drugName.trim());

    if (!validDrugs.length) {
      toast.error('Add at least one drug');
      return;
    }

    const res = await fetch(
      `/api/consultations/${activeConsultation._id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drugs: validDrugs,
          diagnosis: notes.diagnosis,
          notes: rxForm.notes,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      toast.success('Prescription issued!');
      setPrescribeOpen(false);
      setActiveConsultation(null);
      qc.invalidateQueries({ queryKey: ['doctor-consultations'] });
    }
  };

  const getAISuggestion = async () => {
    if (!activeConsultation) return;

    setLoadingAI(true);

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyParts: activeConsultation.bodyParts || [],
          symptoms: activeConsultation.symptoms || [],
          severity: activeConsultation.severity || 5,
        }),
      });

      const data = await res.json();

      if (data.success && data.data.recommendations?.length) {
        const top = data.data.recommendations[0];
        setAiDiagnosis(
          `AI suggests: ${top.drugName} (${top.dosage}, ${top.frequency}) for ${top.indication}`
        );
        toast.success('AI analysis complete');
      }
    } catch {
      toast.error('AI analysis failed');
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Doctor Dashboard"
        subtitle="Manage consultations and patient care"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<Clock className="w-4 h-4" />}
          color="orange"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={<Stethoscope className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          label="Completed Today"
          value={stats.today}
          icon={<CheckCircle className="w-4 h-4" />}
          color="green"
        />
        <StatCard
          label="Total This Month"
          value={stats.completed}
          icon={<Users className="w-4 h-4" />}
          color="purple"
        />
      </div>

      <div className="bg-card border rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg mb-5">
          Recent Consultations
        </h2>

        <div className="space-y-3">
          {consultations
            ?.filter((c: any) => c.status === 'completed')
            .slice(0, 5)
            .map((cons: any) => (
              <div
                key={cons._id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {cons.patientId?.name?.[0] || 'P'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {cons.patientId?.name || 'Patient'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {cons.diagnosis || cons.chiefComplaint}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Completed
                  </span>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {mounted ? timeAgo(cons.createdAt) : 'Just now'}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}