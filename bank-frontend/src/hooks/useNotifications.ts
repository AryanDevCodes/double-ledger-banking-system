import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { notificationApi, receiptApi, type NotificationDTO, type TransactionReceiptDTO, getApiErrorMessage } from "@/lib/api-client";
import { toast } from "sonner";

export const useNotifications = (page = 0, size = 20) => {
  const { user, isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: ["notifications", user?.userId, page, size],
    queryFn: () => notificationApi.getAll(page, size),
    enabled: isAuthenticated && !!user?.userId,
    refetchInterval: 15000,
  });

  const previousUserId = useRef<number | null>(null);
  const knownIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!user?.userId || !query.data) return;

    if (previousUserId.current !== user.userId) {
      previousUserId.current = user.userId;
      knownIds.current = new Set(query.data.content.map((notification) => notification.id));
      return;
    }

    const newNotifications = query.data.content.filter(
      (notification) => !knownIds.current.has(notification.id)
    );
    query.data.content.forEach((notification) => knownIds.current.add(notification.id));

    newNotifications.slice(0, 3).forEach((notification) => {
      toast.info(notification.title, {
        description: notification.message,
        duration: 7000,
      });
    });
  }, [query.data, user?.userId]);

  return query;
};

export const useUnreadNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.userId, "unread"],
    queryFn: () => notificationApi.getUnread(),
    enabled: isAuthenticated && !!user?.userId,
    refetchInterval: 15000,
  });
};

export const useUnreadCount = () => {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.userId, "unread-count"],
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: isAuthenticated && !!user?.userId,
    refetchInterval: 15000,
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
