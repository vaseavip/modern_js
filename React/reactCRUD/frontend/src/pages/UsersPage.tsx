import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  photo: string;
  createdAt: string;
}

const API_URL = 'http://localhost:3000';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  async function loadUsers() {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteUser(id: number) {
    const ok = window.confirm('Sigur dorești să ștergi acest utilizator?');

    if (!ok) return;

    await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
    });

    loadUsers();
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Users Management</h2>

      <table className="table table-striped table-bordered align-middle">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Name</th>
            <th>Surname</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td width="90">
                <img
                  src={`${API_URL}${user.photo}`}
                  alt={user.name}
                  width={60}
                  height={60}
                  style={{
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              </td>

              <td>{user.name}</td>

              <td>{user.surname}</td>

              <td>{user.email}</td>

              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteUser(user.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
