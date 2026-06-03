"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";

export function ProductActiveToggle({
  productId,
  initialActive,
}: {
  productId: string;
  initialActive: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = React.useState(initialActive);
  const toggle = api.product.toggleActive.useMutation({
    onSuccess: (p) => {
      setActive(p.active);
      toast.success(p.active ? "Product reactivated" : "Product archived");
      router.refresh();
    },
    onError: (e) => toast.error(e.message || "Failed to update product"),
  });

  return (
    <div className="flex items-center gap-3">
      <Badge variant={active ? "sage" : "neutral"} size="md">
        {active ? "Active in catalog" : "Archived"}
      </Badge>
      <Button
        type="button"
        variant={active ? "outline" : "soft"}
        size="sm"
        disabled={toggle.isPending}
        onClick={() => toggle.mutate({ id: productId, active: !active })}
      >
        {toggle.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : active ? (
          <PowerOff className="size-3.5" />
        ) : (
          <Power className="size-3.5" />
        )}
        {active ? "Archive" : "Reactivate"}
      </Button>
    </div>
  );
}
