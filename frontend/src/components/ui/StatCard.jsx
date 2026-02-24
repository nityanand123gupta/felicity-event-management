import React from "react";
import Card from "./Card";

export default function StatCard({ title, value, icon }) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h2 className="text-2xl font-semibold mt-1">{value}</h2>
      </div>
      {icon && (
        <div className="text-3xl text-gray-300">
          {icon}
        </div>
      )}
    </Card>
  );
}