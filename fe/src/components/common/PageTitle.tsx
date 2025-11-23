type Props = {
  title: string;
  subtitle?: string;
};

const PageTitle = ({ title, subtitle }: Props) => (
  <div className="mb-4 flex flex-col gap-1">
    <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
    {subtitle ? (
      <p className="text-sm text-slate-600">{subtitle}</p>
    ) : null}
  </div>
);

export default PageTitle;
