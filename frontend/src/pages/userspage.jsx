import React, { useState, useMemo } from "react";
import { UseGetAllUsers, useDeleteUser, useChangeUserRole } from "../api/admin";
import { Search, Shield, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";


const UsersPage = () => {
  const { allusers, isLoading, isError } = UseGetAllUsers();
  const { deleteMyUser, isPending: isDeleting } = useDeleteUser(); // Soft delete hook
  const { changeUserRoleMutate, isPending: isChangingRole } = useChangeUserRole(); // Change role hook

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const navigate = useNavigate();


  // Filtering logic
  const filteredUsers = useMemo(() => {
    if (!allusers) return [];

    return allusers
      .filter(
        (user) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
      )
      .filter((user) =>
        roleFilter === "all" ? true : user.role === roleFilter
      );
  }, [allusers, search, roleFilter]);

  // Delete handler
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirmDelete) return;

    try {
      await deleteMyUser(id);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };
  
  const handleViewUser = async (user) => {
    navigate(`/userdetailspage/${user._id}`)
  }
  // Change role handler
  const handleChangeRole = async (user) => {
    const newRole = window.prompt(
      "Enter new role (student, teacher, admin):",
      user.role
    );

    if (!newRole || !["student", "teacher", "admin"].includes(newRole)) return;

    try {
      await changeUserRoleMutate({ id: user._id, role: newRole });
    } catch (err) {
      console.error("Role change failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="animate-pulse text-gray-500">Loading users...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">Failed to load users</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <span className="text-gray-600 text-sm">
          Total: <span className="font-semibold">{filteredUsers.length}</span>
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 border px-3 py-2 rounded-lg w-64">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users..."
            className="outline-none w-full text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="border px-3 py-2 rounded-lg text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Last Login</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} className="border-t hover:bg-gray-50 transition">
                {/* User Info */}
                <td className="p-4 flex items-center gap-3">
                  <img
                    src={user.picture}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                  </div>
                </td>

                {/* Role */}
                <td className="p-4 capitalize">{user.role}</td>

                {/* Joined */}
                <td className="p-4">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>

                {/* Last Login */}
                <td className="p-4">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : "Never"}
                </td>

                {/* Actions */}
                <td className="p-4 text-right flex justify-end gap-3">
                  {/* View */}
                  <button 
                  onClick={() => handleViewUser(user)}
                  className="text-gray-600 hover:text-blue-600 transition">
                    <Eye size={18} />
                  </button>

                  {/* Change Role */}
                  <button
                    onClick={() => handleChangeRole(user)}
                    className="text-gray-600 hover:text-purple-600 transition"
                    disabled={isChangingRole}
                  >
                    <Shield size={18} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="text-red-600 hover:text-red-800 transition"
                    disabled={isDeleting}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
