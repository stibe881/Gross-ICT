import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Paperclip, X, Download, MessageSquare, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface TicketDetailProps {
  ticketId: number;
  onClose: () => void;
}

export function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: comments, isLoading: commentsLoading } = trpc.comments.getComments.useQuery({
    ticketId,
  });

  const { data: attachments, isLoading: attachmentsLoading } = trpc.comments.getAttachments.useQuery({
    ticketId,
  });

  const createCommentMutation = trpc.comments.createComment.useMutation({
    onSuccess: () => {
      toast.success("Kommentar hinzugefügt");
      setCommentText("");
      utils.comments.getComments.invalidate({ ticketId });
    },
    onError: (error) => {
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
    onError: (error) => {
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-zinc-900 border-white/10">
        <CardHeader className="border-b border-white/10">
          <div className="flex justify-between items-start">
            <CardTitle className="text-white">Ticket #{ticketId}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Attachments Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">Anhänge</h3>
            </div>

            {attachmentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : attachments && attachments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attachments.map((attachment) => (
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
              <p className="text-sm text-gray-400">Keine Anhänge vorhanden</p>
            )}

            {/* File Upload */}
            <div className="mt-4 space-y-3">
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
                  >
                    {uploadAttachmentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Hochladen"
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
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
                  className="w-full"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Datei anhängen
                </Button>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">Kommentare</h3>
            </div>

            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4 mb-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {comment.userId === user?.id ? "Sie" : "Support Team"}
                        </span>
                        {comment.isInternal ? (
                          <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                            Intern
                          </Badge>
                        ) : null}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4">Noch keine Kommentare</p>
            )}

            {/* New Comment */}
            <div className="space-y-3">
              <Textarea
                placeholder="Schreiben Sie einen Kommentar..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px]"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={createCommentMutation.isPending || !commentText.trim()}
                className="w-full"
              >
                {createCommentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Kommentar senden
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
