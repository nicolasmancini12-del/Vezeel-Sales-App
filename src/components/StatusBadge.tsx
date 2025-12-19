
import React, { useEffect, useState } from 'react';
import { getWorkflow } from '../services/storageService';
import { WorkflowStatus } from '../types';

interface Props {
  status: string;
}

const StatusBadge: React.FC<Props> = ({ status }) => {
  const [workflow, setWorkflow] = useState<WorkflowStatus[]>([]);

  useEffect(() => {
    (async () => {
        setWorkflow(await getWorkflow());
    })();
  }, []);

  // Find the color in the workflow configuration
  const statusConfig = workflow.find(w => w.name === status);
  const colorClass = statusConfig ? statusConfig.color : 'bg-gray-100 text-gray-800 border-gray-200';
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} whitespace-nowrap`}>
      {status}
    </span>
  );
};

export default StatusBadge;
