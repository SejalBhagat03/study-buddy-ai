export function PageHeader({ 
  icon: Icon, 
  title, 
  subtitle, 
  bgClass = "bg-indigo-50", 
  iconClass = "text-indigo-600",
  borderClass = "border-indigo-100/50",
  children
}) {
  return (
    <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${bgClass} rounded-xl border ${borderClass} shadow-sm`}>
          <Icon className={`w-5 h-5 ${iconClass}`} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
