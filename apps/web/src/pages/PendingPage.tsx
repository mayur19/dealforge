export interface PendingPageProps {
  readonly title: string;
  readonly ticket: string;
  readonly headingLevel?: 1 | 2;
}

/** Placeholder for screens listed in the PRD but not yet implemented. */
export function PendingPage({ title, ticket, headingLevel = 1 }: PendingPageProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <section className="card pending" aria-label={title}>
      <Heading>{title}</Heading>
      <p>
        This screen is planned but not implemented yet. Tracked as <code>{ticket}</code> in{' '}
        <code>docs/planning/backlog.md</code>.
      </p>
    </section>
  );
}
