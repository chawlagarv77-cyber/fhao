// app.js - minimal client-side auth & storage using localStorage
window.app = (function(){
  const STORAGE_KEYS = { USERS: 'sp_users_v1', STUDENTS: 'sp_students_v1', SESSION: 'sp_session_v1' };

  // default seed user
  function seed() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const admin = { username:'admin', password: btoa('admin123') }; // simple obfuscation
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([admin]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    }
  }

  function readUsers() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'); }
  function writeUsers(us){ localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(us)); }

  const auth = {
    register(username, password) {
      username = (username||'').trim();
      if (!username) return { success:false, message:'Invalid username' };
      const users = readUsers();
      if (users.find(u=>u.username===username)) return { success:false, message:'Username taken' };
      users.push({ username, password: btoa(password) });
      writeUsers(users);
      localStorage.setItem(STORAGE_KEYS.SESSION, username);
      return { success:true };
    },
    login(username, password) {
      const users = readUsers();
      const u = users.find(x => x.username === username && x.password === btoa(password));
      if (u) { localStorage.setItem(STORAGE_KEYS.SESSION, username); return true; }
      return false;
    },
    logout() { localStorage.removeItem(STORAGE_KEYS.SESSION); },
    isLoggedIn() { return !!localStorage.getItem(STORAGE_KEYS.SESSION); },
    currentUser() { return localStorage.getItem(STORAGE_KEYS.SESSION); }
  };

  const storage = {
    _read() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]'); },
    _write(arr){ localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(arr)); },
    _nextId() {
      const arr = this._read();
      const max = arr.reduce((m,s)=>Math.max(m, s.id||0), 0);
      return max+1;
    },
    saveStudent(s){
      const arr = this._read();
      if (s.id) { // update
        const i = arr.findIndex(x=>x.id===s.id);
        if (i>=0) arr[i] = s; else arr.push(s);
      } else {
        s.id = this._nextId();
        arr.push(s);
      }
      this._write(arr);
    },
    getStudents(){ return this._read().slice().sort((a,b)=>a.id-b.id); },
    getStudent(id){ return this._read().find(s=>s.id===id) || null; },
    deleteStudent(id){ const arr = this._read().filter(s=>s.id!==id); this._write(arr); },
    toCSV() {
      const arr = this.getStudents();
      const head = ['ID','FirstName','LastName','Email','Phone','Course','Address'];
      const rows = arr.map(s => [s.id, s.firstName, s.lastName, s.email, s.phone, s.course, (s.address||'').replace(/\n/g,' ')]);
      return [head].concat(rows).map(r => r.map(cell => `"${String(cell||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    }
  };

  seed();
  return { auth, storage };
})();
