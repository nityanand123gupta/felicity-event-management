export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl shadow-sm p-6 hover:shadow-md transition duration-200 ${className || "bg-white border border-gray-100"}`}
    >
      {children}
    </div>
  );
}