import { useEffect, useState } from 'react';
import { policyAPI } from '../services/api';
import { Policy, PolicyCondition } from '../types';

const Policies = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    effect: 'permit' as 'permit' | 'deny',
    priority: 0,
    conditions: [] as PolicyCondition[],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await policyAPI.getAll();
      setPolicies(response.data);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = () => {
    setFormData({
      name: '',
      description: '',
      effect: 'permit',
      priority: 0,
      conditions: [],
    });
    setShowAddModal(true);
  };

  const handleEditPolicy = (policy: Policy) => {
    setSelectedPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description || '',
      effect: policy.effect,
      priority: policy.priority,
      conditions: policy.conditions || [],
    });
    setShowEditModal(true);
  };

  const handleDeletePolicy = (policy: Policy) => {
    setSelectedPolicy(policy);
    setShowDeleteModal(true);
  };

  const handleSubmitAdd = async () => {
    setSubmitting(true);
    try {
      await policyAPI.create(formData);
      setShowAddModal(false);
      fetchPolicies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error creating policy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedPolicy) return;
    setSubmitting(true);
    try {
      await policyAPI.update(selectedPolicy.id, formData);
      setShowEditModal(false);
      fetchPolicies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating policy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedPolicy) return;
    setSubmitting(true);
    try {
      await policyAPI.delete(selectedPolicy.id);
      setShowDeleteModal(false);
      fetchPolicies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting policy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (policy: Policy) => {
    try {
      await policyAPI.toggleActive(policy.id);
      fetchPolicies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error toggling policy');
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        {
          subjectAttr: '',
          resourceAttr: '',
          actionAttr: '',
          environmentAttr: '',
          operator: 'eq',
          value: '',
        },
      ],
    });
  };

  const updateCondition = (index: number, field: keyof PolicyCondition, value: string) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value || null };
    setFormData({ ...formData, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const renderConditionSummary = (condition: PolicyCondition) => {
    const parts = [];
    if (condition.subjectAttr) parts.push(`subject.${condition.subjectAttr}`);
    if (condition.resourceAttr) parts.push(`resource.${condition.resourceAttr}`);
    if (condition.actionAttr) parts.push(`action: ${condition.actionAttr}`);
    if (condition.environmentAttr) parts.push(`env.${condition.environmentAttr}`);
    return `${parts.join(' + ')} ${condition.operator} ${condition.value}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Access Policies (ABAC)</h1>
        <button
          onClick={handleAddPolicy}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Policy
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : policies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No policies found</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effect</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conditions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.map((policy) => (
                <tr key={policy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{policy.name}</div>
                    {policy.description && (
                      <div className="text-sm text-gray-500">{policy.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      policy.effect === 'permit'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {policy.effect}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.priority}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(policy)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        policy.isActive
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs">
                      {policy.conditions && policy.conditions.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {policy.conditions.slice(0, 2).map((cond, idx) => (
                            <li key={idx} className="truncate">{renderConditionSummary(cond)}</li>
                          ))}
                          {policy.conditions.length > 2 && (
                            <li className="text-gray-400">+{policy.conditions.length - 2} more</li>
                          )}
                        </ul>
                      ) : (
                        <span className="text-gray-400">No conditions</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditPolicy(policy)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePolicy(policy)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {showAddModal ? 'Add New Policy' : 'Edit Policy'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Effect *</label>
                  <select
                    value={formData.effect}
                    onChange={(e) => setFormData({ ...formData, effect: e.target.value as 'permit' | 'deny' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="permit">Permit</option>
                    <option value="deny">Deny</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority (0-1000)</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Conditions</label>
                  <button
                    type="button"
                    onClick={addCondition}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    + Add Condition
                  </button>
                </div>

                {formData.conditions.length === 0 && (
                  <p className="text-sm text-gray-500">No conditions. Add one to make this policy context-aware.</p>
                )}

                {formData.conditions.map((condition, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3 mb-3">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-500">Subject Attribute</label>
                        <select
                          value={condition.subjectAttr || ''}
                          onChange={(e) => updateCondition(index, 'subjectAttr', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                        >
                          <option value="">-- None --</option>
                          <option value="userId">User ID</option>
                          <option value="role">Role</option>
                          <option value="department">Department</option>
                          <option value="clearanceLevel">Clearance Level</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500">Resource Attribute</label>
                        <select
                          value={condition.resourceAttr || ''}
                          onChange={(e) => updateCondition(index, 'resourceAttr', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                        >
                          <option value="">-- None --</option>
                          <option value="id">Resource ID</option>
                          <option value="type">Type</option>
                          <option value="ownerId">Owner ID</option>
                          <option value="groupId">Group ID</option>
                          <option value="sensitivity">Sensitivity</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500">Environment Attribute</label>
                        <select
                          value={condition.environmentAttr || ''}
                          onChange={(e) => updateCondition(index, 'environmentAttr', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                        >
                          <option value="">-- None --</option>
                          <option value="isBusinessHours">Is Business Hours</option>
                          <option value="ipAddress">IP Address</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500">Operator</label>
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                        >
                          <option value="eq">Equals</option>
                          <option value="neq">Not Equals</option>
                          <option value="in">In</option>
                          <option value="not_in">Not In</option>
                          <option value="gt">Greater Than</option>
                          <option value="gte">Greater or Equal</option>
                          <option value="lt">Less Than</option>
                          <option value="lte">Less or Equal</option>
                          <option value="contains">Contains</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500">Value (JSON)</label>
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) => updateCondition(index, 'value', e.target.value)}
                          placeholder='e.g. "admin"'
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="px-2 py-1 text-red-600 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleSubmitAdd : handleSubmitEdit}
                disabled={submitting || !formData.name}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : showAddModal ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedPolicy && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Policy</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete policy <strong>{selectedPolicy.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDelete}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Policies;
