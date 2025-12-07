import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Paperclip, X, Download, MessageSquare, FileText, Lock, AlertTriangle, User, Calendar, Tag, UserCheck, BookOpen, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketDetailProps {
  ticketId: number;
  onClose: () => void;
}

export function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [kbSearchOpen, setKbSearchOpen] = useState(false);
  const [kbSearchQuery, setKbSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: ticket, isLoading: ticketLoading } = trpc.tickets.byId.useQuery({ id: ticketId });

  const isStaff = user?.role === 'admin' || user?.role === 'support';

  const { data: comments, isLoading: commentsLoading } = trpc.comments.getComments.useQuery({
    ticketId,
  });

  const { data: attachments, isLoading: attachmentsLoading } = trpc.comments.getAttachments.useQuery({
    ticketId,
  });

  const { data: kbArticles, isLoading: kbLoading } = trpc.kb.all.useQuery(
    { search: kbSearchQuery },
    { enabled: kbSearchOpen && kbSearchQuery.length > 2 }
  );

  const { data: allUsers } = trpc.users.all.useQuery(undefined, {
    enabled: isStaff,
  });

  const supportStaff = allUsers?.filter((u: any) => u.role === 'admin' || u.role === 'support');

  const assignTicketMutation = trpc.tickets.assign.useMutation({
    onSuccess: () => {
      toast.success("Ticket zugewiesen");
      utils.tickets.byId.invalidate({ id: ticketId });
    },
    onError: (error: any) => {
      toast.error(error.message || "Fehler beim Zuweisen des Tickets");
    },
  });

  const createCommentMutation = trpc.comments.createComment.useMutation({
    onSuccess: () => {
      toast.success(isPrivateNote ? "Private Notiz hinzugefügt" : "Kommentar hinzugefügt");
      setCommentText("");
      setIsPrivateNote(false);
      utils.comments.getComments.invalidate({ ticketId });
    },
    onError: (error: any) => {
      toast.error(error.message || "Fehler beim Hinzufügen des Kommentars");
    },
  });

  const uploadAttachmentMutation = trpc.comments.uploadAttachment.useMutation({
    onSuccess: () => {
      toast.success("Datei hochgeladen");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      utils.comments.getAttachments.invalidate({ ticketId });
    },
    onError: (error: any) => {
      toast.error(error.message || "Fehler beim Hochladen der Datei");
    },
  });

  const handleSubmitComment = () => {
    if (!commentText.trim()) {
      toast.error("Bitte geben Sie einen Kommentar ein");
      return;
    }

    createCommentMutation.mutate({
      ticketId,
      message: commentText,
      isInternal: isPrivateNote,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Datei ist zu groß (max. 10MB)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result?.toString().split(",")[1];
      if (!base64Data) {
        toast.error("Fehler beim Lesen der Datei");
        return;
      }

      uploadAttachmentMutation.mutate({
        ticketId,
        filename: selectedFile.name,
        fileData: base64Data,
        mimeType: selectedFile.type,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      resolved: "bg-green-500/20 text-green-400 border-green-500/30",
      closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-500/20 text-green-400 border-green-500/30",
      medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      urgent: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[priority] || colors.medium;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      network: "Netzwerk",
      security: "Sicherheit",
      hardware: "Hardware",
      software: "Software",
      email: "E-Mail",
      other: "Sonstiges",
    };
    return labels[category] || category;
  };

  // Filter comments based on user role
  const filteredComments = comments?.filter((comment: any) => {
    // Staff can see all comments
    if (isStaff) return true;
    // Customers can only see non-internal comments
    return comment.isInternal === 0;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl my-8 max-h-[90vh] overflow-y-auto">
        <Card className="bg-zinc-900 border-white/10">
          <CardHeader className="border-b border-white/10 sticky top-0 bg-zinc-900 z-20 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white text-2xl">Ticket #{ticketId}</CardTitle>
              {ticket && (
                <p className="text-sm text-gray-400 mt-1">{ticket.subject}</p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {ticketLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : ticket ? (
            <>
              {/* Ticket Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Kunde
                    </h3>
                    <p className="text-white">{ticket.customerName}</p>
                    <p className="text-sm text-gray-400">{ticket.customerEmail}</p>
                    {ticket.company && <p className="text-sm text-gray-400">{ticket.company}</p>}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Zeitstempel
                    </h3>
                    <p className="text-sm text-white">Erstellt: {formatDate(ticket.createdAt)}</p>
                    {ticket.resolvedAt && (
                      <p className="text-sm text-white">Gelöst: {formatDate(ticket.resolvedAt)}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Status & Priorität
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status === "in_progress" ? "In Bearbeitung" : ticket.status === "open" ? "Offen" : ticket.status === "resolved" ? "Gelöst" : "Geschlossen"}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {getCategoryLabel(ticket.category)}
                      </Badge>
                    </div>
                  </div>

                  {ticket.slaDueDate && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        SLA Status
                      </h3>
                      <Badge className={new Date(ticket.slaDueDate) < new Date() ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>
                        {new Date(ticket.slaDueDate) < new Date() ? 'Überfällig' : `Fällig: ${formatDate(ticket.slaDueDate)}`}
                      </Badge>
                      {ticket.escalationLevel && ticket.escalationLevel > 0 && (
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 ml-2">
                          Eskalation Level {ticket.escalationLevel}
                        </Badge>
                      )}
                    </div>
                  )}

                  {isStaff && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Zugewiesen an
                      </h3>
                      <Select
                        value={ticket.assignedTo?.toString() || "unassigned"}
                        onValueChange={(value) => {
                          const assignedTo = value === "unassigned" ? null : parseInt(value);
                          assignTicketMutation.mutate({
                            ticketId: ticket.id,
                            assignedTo,
                          });
                        }}
                        disabled={assignTicketMutation.isPending}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                          {supportStaff?.map((staff: any) => (
                            <SelectItem key={staff.id} value={staff.id.toString()}>
                              {staff.name || staff.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Original Message */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Ursprüngliche Nachricht
                </h3>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white whitespace-pre-wrap">{ticket.message}</p>
                </div>
              </div>

              {/* Attachments Section */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Anhänge
                </h3>

                {attachmentsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : attachments && attachments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {attachments.map((attachment: any) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{attachment.filename}</p>
                            <p className="text-xs text-gray-400">
                              {formatFileSize(attachment.fileSize)} • {formatDate(attachment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="flex-shrink-0"
                        >
                          <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-4">Keine Anhänge vorhanden</p>
                )}

                {/* File Upload */}
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt,.log"
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <Paperclip className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{selectedFile.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleUploadFile}
                        disabled={uploadAttachmentMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {uploadAttachmentMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Hochladen"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-white/20 bg-white/5 hover:bg-white/10"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Datei anhängen
                    </Button>
                  )}
                </div>
              </div>

              {/* Comments/Messages Section */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Nachrichtenverlauf
                </h3>

                {commentsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredComments && filteredComments.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {filteredComments.map((comment: any) => (
                      <div
                        key={comment.id}
                        className={`p-4 rounded-lg border ${
                          comment.isInternal === 1
                            ? "bg-orange-500/10 border-orange-500/30"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">
                              {comment.userName || "Unbekannt"}
                            </p>
                            {comment.isInternal === 1 && isStaff && (
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Private Notiz
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{formatDate(comment.createdAt)}</p>
                        </div>
                        <p className="text-white whitespace-pre-wrap">{comment.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-4">Keine Kommentare vorhanden</p>
                )}

                {/* KB Search */}
                {isStaff && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setKbSearchOpen(!kbSearchOpen)}
                      className="w-full border-white/10 text-white hover:bg-white/10"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      {kbSearchOpen ? "KB-Suche schließen" : "Wissensdatenbank durchsuchen"}
                    </Button>
                    {kbSearchOpen && (
                      <div className="mt-3 space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={kbSearchQuery}
                            onChange={(e) => setKbSearchQuery(e.target.value)}
                            placeholder="Suche nach Lösungen..."
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        {kbLoading && (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                        {kbArticles && kbArticles.length > 0 && (
                          <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {kbArticles.map((article: any) => (
                              <div
                                key={article.id}
                                className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => {
                                  setCommentText(commentText + (commentText ? "\n\n" : "") + article.content);
                                  setKbSearchOpen(false);
                                  setKbSearchQuery("");
                                  toast.success("KB-Artikel eingefügt");
                                }}
                              >
                                <h4 className="text-sm font-medium text-white mb-1">{article.title}</h4>
                                <p className="text-xs text-gray-400 line-clamp-2">{article.content}</p>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                                  {article.visibility === "internal" && (
                                    <Badge variant="outline" className="text-xs">
                                      <Lock className="h-3 w-3 mr-1" />
                                      Intern
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {kbSearchQuery.length > 2 && !kbLoading && kbArticles && kbArticles.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">Keine Artikel gefunden</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Add Comment */}
                <div className="space-y-3">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Kommentar hinzufügen..."
                    className="bg-white/5 border-white/10 text-white min-h-[100px]"
                  />
                  {isStaff && (
                    <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg border border-white/10">
                      <Checkbox
                        id="private-note"
                        checked={isPrivateNote}
                        onCheckedChange={(checked) => setIsPrivateNote(checked as boolean)}
                        className="border-white/30"
                      />
                      <Label
                        htmlFor="private-note"
                        className="text-sm text-gray-300 cursor-pointer flex items-center gap-2 font-medium"
                      >
                        <Lock className="h-4 w-4" />
                        Als private Notiz markieren (nur für Mitarbeitende sichtbar)
                      </Label>
                    </div>
                  )}
                  <Button
                    onClick={handleSubmitComment}
                    disabled={createCommentMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {createCommentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {isPrivateNote ? "Private Notiz hinzufügen" : "Kommentar senden"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 py-12">Ticket nicht gefunden</p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
