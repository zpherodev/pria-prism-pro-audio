
import { Note } from '@/types/pianoRoll';

// Convert piano roll notes to MIDI file
export const notesToMidiFile = (notes: Note[]): Blob => {
  // Create a MIDI file with a single track
  const midiWriter = require('midi-writer-js');
  const track = new midiWriter.Track();
  
  // Add tempo information - 120 BPM is standard
  track.setTempo(120);
  
  // Convert each note to MIDI format
  notes.forEach(note => {
    // Create a new note event
    const midiNote = new midiWriter.NoteEvent({
      pitch: note.key,
      duration: 'T' + Math.round(note.duration * 128), // Convert to ticks
      startTick: Math.round(note.startTime * 128), // Convert to ticks
      velocity: note.velocity || 100 // Default to 100 if not specified
    });
    
    track.addEvent(midiNote);
  });
  
  // Generate the MIDI file
  const writer = new midiWriter.Writer([track]);
  return new Blob([writer.buildFile()], { type: 'audio/midi' });
};

// Convert MIDI file to piano roll notes
export const midiFileToNotes = async (file: File): Promise<Note[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const midiParser = require('midi-parser-js');
        const midiData = midiParser.parse(e.target?.result);
        
        // Extract notes from MIDI data
        const notes: Note[] = [];
        const ticksPerBeat = midiData.header.ticksPerBeat;
        
        // Process each track
        midiData.track.forEach((track: any) => {
          let currentTick = 0;
          
          // Process each event in the track
          track.event.forEach((event: any) => {
            currentTick += event.deltaTime;
            
            // Note on event
            if (event.type === 9 && event.data[1] > 0) {
              const midiNote = event.data[0];
              const velocity = event.data[1];
              const startTime = currentTick / ticksPerBeat / 4; // Convert ticks to seconds
              
              // Find the corresponding note off event
              const noteOffIndex = track.event.findIndex((e: any, i: number) => {
                return i > track.event.indexOf(event) && 
                       ((e.type === 8 && e.data[0] === midiNote) || 
                        (e.type === 9 && e.data[0] === midiNote && e.data[1] === 0));
              });
              
              if (noteOffIndex !== -1) {
                let endTick = currentTick;
                
                // Calculate end tick by summing delta times
                for (let i = track.event.indexOf(event) + 1; i <= noteOffIndex; i++) {
                  endTick += track.event[i].deltaTime;
                }
                
                const duration = (endTick - currentTick) / ticksPerBeat / 4; // Convert ticks to seconds
                
                notes.push({
                  id: `midi-${notes.length}`,
                  key: midiNote,
                  startTime,
                  duration,
                  velocity
                });
              }
            }
          });
        });
        
        resolve(notes);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};

// Helper function to trigger file download
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
