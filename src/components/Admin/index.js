import React, { Component } from 'react';
import { compose } from 'recompose';

import { withFirebase } from '../Firebase';
import * as ROLES from '../../constants/roles';
import withAuthorization from '../Session/withAuthorization';

class AdminPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      error: false,
      users: [],
    };
  }

  componentDidMount() {
    this.setState({ loading: true });

    this.props.firebase
      .users()
      .once('value')
      .then(snapshot => {
        const usersObject = snapshot.val();
        const users = Object.keys(usersObject).map(key => ({
          ...usersObject[key],
          uid: key,
        }));

        this.setState(state => ({
          users,
          loading: false,
        }));
      })
      .catch(error => {
        this.setState({ error: true, loading: false });
      });

    this.props.firebase.users().on('child_removed', snapshot => {
      this.setState(state => ({
        users: state.users.filter(user => user.uid !== snapshot.key),
      }));
    });
  }

  onRemove = userId => {
    this.props.firebase.user(userId).remove();
  };

  render() {
    const { users, loading, error } = this.state;

    return (
      <div>
        <h1>Admin</h1>
        <p>
          The Admin Page is accessible by every signed in admin user.
        </p>

        {loading && <div>Loading ...</div>}
        {error && <div>Something went wrong ...</div>}

        <UserList users={users} onRemove={this.onRemove} />
      </div>
    );
  }
}

const UserList = ({ users, onRemove }) => (
  <ul>
    {users.map(user => (
      <li key={user.uid}>
        <span>
          <strong>ID:</strong> {user.uid}
        </span>
        <span>
          <strong>E-Mail:</strong> {user.email}
        </span>
        <span>
          <strong>Username:</strong> {user.username}
        </span>
        <span>
          <strong>Roles:</strong> {(user.roles || []).join('')}
        </span>
        <span>
          <button type="button" onClick={() => onRemove(user.uid)}>
            Remove
          </button>
        </span>
      </li>
    ))}
  </ul>
);

const authCondition = authUser =>
  authUser && authUser.roles.includes(ROLES.ADMIN);

export default compose(
  withAuthorization(authCondition),
  withFirebase,
)(AdminPage);
