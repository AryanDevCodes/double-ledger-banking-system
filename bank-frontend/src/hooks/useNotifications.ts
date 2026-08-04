import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi, receiptApi, type NotificationDTO, type TransactionReceiptDTO, getApiErrorMessage } from "@/lib/api-client";
import { toast } from "sonner";

export const useNotifications = (page = 0, size = 20) => {
  return useQuery({
    queryKey: ["notifications", page, size],
    queryFn: () => notificationApi.getAll(page, size),
    refetchInterval: 30000,
  });
};

export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => notificationApi.getUnread(),
    refetchInterval: 30000,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 30000,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to mark notification as read"));
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to mark all notifications as read"));
    },
  });
};

export const useTransactionReceipt = (transactionId: number | null) => {
  return useQuery({
    queryKey: ["transaction-receipt", transactionId],
    queryFn: () => receiptApi.getByTransactionId(transactionId!),
    enabled: !!transactionId,
  });
};
