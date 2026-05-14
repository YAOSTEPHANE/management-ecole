import type { LibraryLoan, Prisma } from '@prisma/client';
import prisma from './prisma';

type CreateLoansInput = {
  bookIds: string[];
  borrowerId: string;
  dueDate: Date;
  notes?: string | null;
  createdById?: string | null;
};

function countByBook(bookIds: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of bookIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

async function createLoansInTx(tx: Prisma.TransactionClient, input: CreateLoansInput) {
  const { bookIds, borrowerId, dueDate, notes, createdById } = input;
  const uniqueIds = [...new Set(bookIds)];
  if (bookIds.length === 0) {
    throw Object.assign(new Error('Au moins un ouvrage est requis'), { status: 400 });
  }

  const borrower = await tx.user.findUnique({ where: { id: borrowerId } });
  if (!borrower) {
    throw Object.assign(new Error('Emprunteur introuvable'), { status: 404 });
  }

  const counts = countByBook(bookIds);
  for (const bookId of uniqueIds) {
    const book = await tx.libraryBook.findUnique({ where: { id: bookId } });
    const qty = counts.get(bookId) ?? 0;
    if (!book || !book.isActive) {
      throw Object.assign(new Error(`Livre introuvable ou inactif`), { status: 404 });
    }
    if (book.copiesAvailable < qty) {
      throw Object.assign(
        new Error(`Stock insuffisant pour « ${book.title} » (${book.copiesAvailable} disponible(s))`),
        { status: 400 },
      );
    }
  }

  const loans: LibraryLoan[] = [];
  for (const bookId of bookIds) {
    const loan = await tx.libraryLoan.create({
      data: {
        bookId,
        borrowerId,
        dueDate,
        notes: notes?.trim() || null,
        createdById: createdById ?? null,
        status: 'ACTIVE',
      },
    });
    await tx.libraryBook.update({
      where: { id: bookId },
      data: { copiesAvailable: { decrement: 1 } },
    });
    loans.push(loan);
  }

  return loans;
}

export async function createLibraryLoansBatch(input: CreateLoansInput) {
  return prisma.$transaction((tx) => createLoansInTx(tx, input));
}
