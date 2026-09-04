import React from 'react';

export function PageLayout({ title, children }) {
  return (
    <main>
      <header>
        <h1>KnowledgeFlow</h1>
        <span>{title}</span>
      </header>
      {children}
    </main>
  );
}

export function ErrorMessage({ message }) {
  return message ? <p className="error">{message}</p> : null;
}
