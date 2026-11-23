import { ArrowUpRight } from "lucide-react"
import { Link } from "wouter"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

import { QueryContent } from "./AdminUi"
import { useAdminOverviewViewModel } from "./useAdminOverviewViewModel"

export function AdminOverview({ sessionId }: { sessionId: number }) {
  const queues = useAdminOverviewViewModel(sessionId)

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {queues.map((queue) => (
        <Card key={queue.id} className="min-w-0 gap-4">
          <CardHeader>
            <div className="mb-2 grid size-9 place-items-center rounded-xl bg-primary/20 text-primary-foreground dark:text-primary">
              <queue.icon aria-hidden="true" className="size-4" />
            </div>
            <CardTitle>
              <h2>{queue.title}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <QueryContent state={queue.query}>
              {queue.items && queue.items.length > 0 ? (
                <ul className="divide-y">
                  {queue.items.map((item) => (
                    <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                      <Link
                        href={item.href}
                        className="block rounded-sm outline-offset-4 hover:underline focus-visible:outline"
                      >
                        <span className="line-clamp-2 text-sm font-medium break-words">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.subtitle}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{queue.empty}</p>
              )}
            </QueryContent>
          </CardContent>
          <CardFooter>
            <Link
              href={queue.href}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View queue <ArrowUpRight aria-hidden="true" />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
