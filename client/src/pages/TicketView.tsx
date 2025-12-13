import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { useState } from "react";
import { Loader2, CheckCircle, Clock, AlertCircle, ArrowLeft, Send, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function TicketView() {
    const { language } = useLanguage();
    const params = useParams<{ token: string }>();
    const token = params.token || "";
    const [newComment, setNewComment] = useState("");

    const ticketQuery = trpc.tickets.publicByToken.useQuery(
        { token },
        { enabled: !!token, retry: false }
    );

    const addCommentMutation = trpc.tickets.publicAddComment.useMutation({
        onSuccess: () => {
            setNewComment("");
            ticketQuery.refetch();
            toast.success(
                language === 'de'
                    ? 'Ihre Nachricht wurde hinzugefügt'
                    : 'Your message has been added'
            );
        },
        onError: (error) => {
            toast.error(error.message || (language === 'de' ? 'Fehler beim Senden' : 'Error sending message'));
        },
    });

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        addCommentMutation.mutate({ token, message: newComment.trim() });
    };

    if (ticketQuery.isLoading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">
                            {language === 'de' ? 'Ticket wird geladen...' : 'Loading ticket...'}
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (ticketQuery.error) {
        return (
            <Layout>
                <SEO title={language === 'de' ? "Ticket nicht gefunden" : "Ticket not found"} />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center p-8 max-w-md">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-4">
                            {language === 'de' ? 'Ticket nicht gefunden' : 'Ticket not found'}
                        </h1>
                        <p className="text-muted-foreground mb-6">
                            {language === 'de'
                                ? 'Dieser Ticket-Link ist ungültig oder abgelaufen.'
                                : 'This ticket link is invalid or has expired.'}
                        </p>
                        <Link href="/support-center">
                            <Button>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {language === 'de' ? 'Zum Support Center' : 'Go to Support Center'}
                            </Button>
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    const ticket = ticketQuery.data;
    if (!ticket) return null;

    const getStatusDisplay = () => {
        switch (ticket.status) {
            case 'resolved':
            case 'closed':
                return {
                    icon: CheckCircle,
                    color: 'text-green-400',
                    bg: 'bg-green-500/10',
                    border: 'border-green-500/30',
                    label: ticket.status === 'resolved'
                        ? (language === 'de' ? 'Gelöst' : 'Resolved')
                        : (language === 'de' ? 'Geschlossen' : 'Closed'),
                };
            case 'in_progress':
                return {
                    icon: Clock,
                    color: 'text-blue-400',
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/30',
                    label: language === 'de' ? 'In Bearbeitung' : 'In Progress',
                };
            default:
                return {
                    icon: AlertCircle,
                    color: 'text-yellow-400',
                    bg: 'bg-yellow-500/10',
                    border: 'border-yellow-500/30',
                    label: language === 'de' ? 'Offen' : 'Open',
                };
        }
    };

    const getPriorityDisplay = () => {
        const priorities: Record<string, { label: string; color: string }> = {
            urgent: { label: language === 'de' ? 'Dringend' : 'Urgent', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
            high: { label: language === 'de' ? 'Hoch' : 'High', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
            medium: { label: language === 'de' ? 'Mittel' : 'Medium', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
            low: { label: language === 'de' ? 'Niedrig' : 'Low', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
        };
        return priorities[ticket.priority || 'medium'];
    };

    const status = getStatusDisplay();
    const priority = getPriorityDisplay();
    const StatusIcon = status.icon;
    const isClosedOrResolved = ticket.status === 'closed' || ticket.status === 'resolved';

    return (
        <Layout>
            <SEO
                title={`Ticket #${ticket.ticketNumber} - ${ticket.subject}`}
                description={language === 'de' ? "Ihr Support-Ticket Status" : "Your support ticket status"}
            />

            <div className="relative pt-32 pb-20 min-h-screen">
                <div className="absolute inset-0 bg-primary/5 blur-[150px] pointer-events-none"></div>
                <div className="container relative z-10 max-w-4xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Back Link */}
                        <Link href="/support-center">
                            <Button variant="ghost" className="mb-6">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {language === 'de' ? 'Zurück zum Support Center' : 'Back to Support Center'}
                            </Button>
                        </Link>

                        {/* Ticket Header */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 mb-8">
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Ticket #{ticket.ticketNumber}</p>
                                    <h1 className="text-2xl md:text-3xl font-bold">{ticket.subject}</h1>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full ${status.bg} ${status.color} border ${status.border}`}>
                                        <StatusIcon className="w-4 h-4" />
                                        {status.label}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm border ${priority.color}`}>
                                        {priority.label}
                                    </span>
                                </div>
                            </div>

                            {/* Ticket Details */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {language === 'de' ? 'Beschreibung' : 'Description'}
                                    </p>
                                    <p className="whitespace-pre-wrap text-foreground/90">{ticket.description}</p>
                                </div>

                                <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">{language === 'de' ? 'Erstellt am' : 'Created on'}:</span>{' '}
                                        <span className="font-medium">
                                            {new Date(ticket.createdAt).toLocaleDateString('de-CH', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    {ticket.resolvedAt && (
                                        <div>
                                            <span className="text-muted-foreground">{language === 'de' ? 'Gelöst am' : 'Resolved on'}:</span>{' '}
                                            <span className="font-medium">
                                                {new Date(ticket.resolvedAt).toLocaleDateString('de-CH', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 mb-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                {language === 'de' ? 'Kommunikation' : 'Communication'}
                                {ticket.comments && ticket.comments.length > 0 && ` (${ticket.comments.length})`}
                            </h2>

                            {/* Comments List */}
                            {ticket.comments && ticket.comments.length > 0 ? (
                                <div className="space-y-4 mb-8">
                                    {ticket.comments.map((comment: any) => (
                                        <div
                                            key={comment.id}
                                            className={`p-4 rounded-xl border ${comment.author === 'Kunde' || !comment.author
                                                    ? 'bg-blue-500/5 border-blue-500/20 ml-8'
                                                    : 'bg-primary/5 border-primary/20 mr-8'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`font-medium ${comment.author === 'Kunde' || !comment.author ? 'text-blue-400' : 'text-primary'
                                                    }`}>
                                                    {comment.author || (language === 'de' ? 'Kunde' : 'Customer')}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(comment.createdAt).toLocaleDateString('de-CH', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                            <p className="whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-6 mb-6">
                                    {language === 'de'
                                        ? 'Noch keine Nachrichten. Wir melden uns bald bei Ihnen.'
                                        : 'No messages yet. We will get back to you soon.'}
                                </p>
                            )}

                            {/* Add Comment Form */}
                            {!isClosedOrResolved ? (
                                <form onSubmit={handleSubmitComment} className="border-t border-white/10 pt-6">
                                    <h3 className="font-medium mb-3">
                                        {language === 'de' ? 'Nachricht hinzufügen' : 'Add Message'}
                                    </h3>
                                    <Textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={language === 'de'
                                            ? 'Schreiben Sie Ihre Nachricht hier...'
                                            : 'Write your message here...'}
                                        className="min-h-[100px] bg-black/20 border-white/10 mb-4"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!newComment.trim() || addCommentMutation.isPending}
                                        className="gap-2"
                                    >
                                        {addCommentMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                {language === 'de' ? 'Wird gesendet...' : 'Sending...'}
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                {language === 'de' ? 'Nachricht senden' : 'Send Message'}
                                            </>
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <div className="border-t border-white/10 pt-6 text-center">
                                    <p className="text-muted-foreground">
                                        {language === 'de'
                                            ? 'Dieses Ticket ist geschlossen. Für weitere Anfragen erstellen Sie bitte ein neues Ticket.'
                                            : 'This ticket is closed. For further requests, please create a new ticket.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
}

