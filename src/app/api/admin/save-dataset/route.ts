import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { RawExercise } from '@/types/exercise';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { exercises } = body;

    if (!Array.isArray(exercises)) {
      return NextResponse.json(
        { error: 'Invalid payload: exercises must be an array' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'src/data/rawExercisesData.ts');

    const fileContent = `import { RawExercise } from '../types/exercise';

// Full list of Calisthenics Exercises (Synced via Admin Manager)
export const rawExercises: RawExercise[] = ${JSON.stringify(exercises, null, 2)};
`;

    fs.writeFileSync(filePath, fileContent, 'utf8');

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${exercises.length} exercises to rawExercisesData.ts`,
      count: exercises.length,
    });
  } catch (error: any) {
    console.error('Failed to sync dataset to file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to write dataset file' },
      { status: 500 }
    );
  }
}
