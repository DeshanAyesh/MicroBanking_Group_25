export function BlockedNotice({ operation }: { operation: string }) {
  return (
    <div className="blocked">
      BLOCKED — SQL TODO required: {operation}
    </div>
  );
}
