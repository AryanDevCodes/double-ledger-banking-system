import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CheckCheck,
  CircleCheck,
  Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadCount,
} from "@/hooks/useNotifications";
import type { NotificationDTO } from "@/lib/api-client";

const typeStyles: Record<string, { icon: typeof CircleCheck; color: string }> = {
  TRANSACTION_DEBIT: { icon: ArrowUpRight, color: "text-rose-500 bg-rose-500/10" },
  TRANSACTION_CREDIT: { icon: ArrowDownLeft, color: "text-emerald-500 bg-emerald-500/10" },
  SYSTEM_ALERT: { icon: Info, color: "text-amber-500 bg-amber-500/10" },
};

function getTransferDetails(notification: NotificationDTO) {
  const title = /^Money (Sent|Received) - (.+)$/.exec(notification.title);
  const parts = notification.message.split(" · ");
  const isDebit = notification.type === "TRANSACTION_DEBIT";
  const counterpartyPrefix = isDebit ? "To " : "From ";
  const counterpartyPart = parts[0];

  if (
    !title ||
    !title[2] ||
    (notification.type !== "TRANSACTION_DEBIT" &&
      notification.type !== "TRANSACTION_CREDIT") ||
    !counterpartyPart ||
    !counterpartyPart.startsWith(counterpartyPrefix)
  ) {
    return null;
  }

  return {
    direction: isDebit ? "Sent" : "Received",
    amount: title[2],
    counterparty: counterpartyPart.slice(counterpartyPrefix.length),
    account: parts.find((part) => part.startsWith("A/c ")),
    reference: parts.find((part) => part.startsWith("Ref #")),
    isDebit,
  };
}

function notificationTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Just now"
    : formatDistanceToNow(date, { addSuffix: true });
}

function NotificationRow({
  notification,
  onMarkAsRead,
  isPending,
}: {
  notification: NotificationDTO;
  onMarkAsRead: (id: number) => void;
  isPending: boolean;
}) {
  const style = typeStyles[notification.type] ?? {
    icon: Info,
    color: "text-sky-500 bg-sky-500/10",
  };
  const Icon = style.icon;
  const transfer = getTransferDetails(notification);

  return (
    <DropdownMenuItem
      onSelect={(event) => {
        if (!notification.isRead) {
          event.preventDefault();
          onMarkAsRead(notification.id);
        }
      }}
      disabled={!notification.isRead && isPending}
      className={`group flex cursor-pointer items-start gap-3 rounded-none px-4 py-3.5 focus:bg-muted/60 ${
        notification.isRead ? "" : "bg-primary/[0.03]"
      }`}
    >
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.color}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        {transfer ? (
          <>
            <span className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Transfer {transfer.direction}
              </span>
              {!notification.isRead && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
              )}
            </span>
            <span className="mt-1 flex items-start justify-between gap-3">
              <span className={`min-w-0 truncate text-sm ${notification.isRead ? "font-medium" : "font-semibold"} text-foreground`}>
                {transfer.counterparty}
              </span>
              <span
                className={`shrink-0 font-mono text-sm font-bold tabular-nums ${
                  transfer.isDebit ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {transfer.isDebit ? "−" : "+"}{transfer.amount}
              </span>
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-1.5">
              {transfer.account && (
                <span className="rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {transfer.account}
                </span>
              )}
              {transfer.reference && (
                <span className="rounded-md bg-primary/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {transfer.reference}
                </span>
              )}
            </span>
          </>
        ) : (
          <>
            <span className="flex items-start justify-between gap-2">
              <span className={`text-sm leading-5 ${notification.isRead ? "font-medium text-foreground/80" : "font-semibold text-foreground"}`}>
                {notification.title}
              </span>
              {!notification.isRead && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
              )}
            </span>
            <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {notification.message}
            </span>
          </>
        )}
        <span className="mt-2 block text-[11px] text-muted-foreground/70">
          {notificationTime(notification.createdAt)}
        </span>
      </span>
    </DropdownMenuItem>
  );
}

export default function NotificationCenter() {
  const notifications = useNotifications(0, 10);
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const items = notifications.data?.content ?? [];
  const unread = unreadCount.data?.count ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-md border border-border bg-card hover:bg-muted"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="h-4 w-4 text-muted-foreground/80" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground shadow-sm ring-2 ring-background">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(24rem,calc(100vw_-_1.5rem))] overflow-hidden rounded-lg border-border bg-card p-0 shadow-md"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50 text-primary">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">Notifications</span>
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {unread === 0 ? "You’re all caught up" : `${unread} unread message${unread === 1 ? "" : "s"}`}
              </span>
            </span>
          </span>
          {unread > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 gap-1.5 rounded-lg px-2 text-xs text-primary hover:text-primary"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0 bg-border/50" />

        <div className="max-h-[min(26rem,65vh)] overflow-y-auto overscroll-contain">
          {notifications.isPending ? (
            <div className="space-y-3 px-4 py-5" aria-label="Loading notifications">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex animate-pulse items-start gap-3">
                  <span className="h-9 w-9 rounded-xl bg-muted" />
                  <span className="flex-1 space-y-2 pt-1">
                    <span className="block h-3 w-2/3 rounded bg-muted" />
                    <span className="block h-3 w-full rounded bg-muted/70" />
                    <span className="block h-2.5 w-1/4 rounded bg-muted/50" />
                  </span>
                </div>
              ))}
            </div>
          ) : notifications.isError ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-medium">Notifications couldn’t be loaded</p>
              <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
              <DropdownMenuItem asChild>
                <Button variant="outline" size="sm" className="mt-4 rounded-lg" onClick={() => void notifications.refetch()}>
                  Try again
                </Button>
              </DropdownMenuItem>
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-medium">You’re all caught up</p>
              <p className="mt-1 text-xs text-muted-foreground">New account activity will show up here.</p>
            </div>
          ) : (
            items.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onMarkAsRead={(id) => markAsRead.mutate(id)}
                isPending={markAsRead.isPending}
              />
            ))
          )}
        </div>
        {items.length > 0 && (
          <>
            <DropdownMenuSeparator className="m-0 bg-border/50" />
            <div className="flex items-center justify-between bg-muted/20 px-4 py-2.5">
              <span className="text-[11px] text-muted-foreground">Updates automatically</span>
              {notifications.isFetching && (
                <span className="text-[11px] text-muted-foreground">Checking…</span>
              )}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
