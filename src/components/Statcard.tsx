interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  description?: string;
}

function StatCard({
  title,
  value,
  icon,
  description,
}: StatCardProps) {

  return (
    <div className="stat-card">

      <div className="stat-card-top">

        <div>

          <p className="stat-card-title">
            {title}
          </p>

          <h3>
            {value}
          </h3>

        </div>

        <div className="stat-card-icon">
          {icon}
        </div>

      </div>

      {description && (
        <p className="stat-card-description">
          {description}
        </p>
      )}

    </div>
  );
}

export default StatCard;