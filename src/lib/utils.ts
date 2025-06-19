import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function parseCSV(csvText: string): string[][] {
	const rows = csvText.split(/\r?\n/);
	return rows.map(row => {
		// Handle quoted values with commas inside
		const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
		return matches.map(value => value.replace(/^"|"$/g, '').trim());
	});
}
