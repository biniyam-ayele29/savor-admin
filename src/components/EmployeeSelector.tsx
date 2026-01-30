import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, ChevronDown, Loader2 } from 'lucide-react';

interface Employee {
    id: string;
    name: string;
    company_id: string;
}

interface GroupedEmployees {
    companyName: string;
    employees: Employee[];
}

interface EmployeeSelectorProps {
    onSelect: (employeeId: string, companyId: string) => void;
    selectedId?: string;
}

const EmployeeSelector = ({ onSelect, selectedId }: EmployeeSelectorProps) => {
    const [groupedData, setGroupedData] = useState<GroupedEmployees[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAndGroupData();
    }, []);

    const fetchAndGroupData = async () => {
        try {
            setLoading(true);

            const [{ data: companies }, { data: employees }] = await Promise.all([
                supabase.from('companies').select('id, name').order('name'),
                supabase.from('employees').select('id, name, company_id').order('name')
            ]);

            if (companies && employees) {
                const grouped = companies.map(company => ({
                    companyName: company.name,
                    employees: employees.filter(emp => emp.company_id === company.id)
                })).filter(group => group.employees.length > 0);

                setGroupedData(grouped);
            }
        } catch (error) {
            console.error('Error fetching grouped data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={16} />
                <span>Loading employees...</span>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} size={20} />
            <select
                value={selectedId}
                onChange={(e) => {
                    const empId = e.target.value;
                    const group = groupedData.find(g => g.employees.some(emp => emp.id === empId));
                    const companyId = group?.employees.find(emp => emp.id === empId)?.company_id;
                    if (companyId) onSelect(empId, companyId);
                }}
                style={{ paddingLeft: '3rem', cursor: 'pointer', appearance: 'none' }}
                className="glass"
            >
                <option value="">Select Employee...</option>
                {groupedData.map(group => (
                    <optgroup key={group.companyName} label={group.companyName}>
                        {group.employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.name}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
            <ChevronDown style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} size={20} />
        </div>
    );
};

export default EmployeeSelector;
