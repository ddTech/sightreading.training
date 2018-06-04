import * as React from "react"
import {classNames} from "lib"

import * as types from "prop-types"
import {parseNote, noteStaffOffset, MIDDLE_C_PITCH} from "st/music"

import {SongNoteList, SongNote} from "st/song_note_list"
import LedgerLines from "st/components/staff/ledger_lines"
import WholeNotes from "st/components/staff/whole_notes"

export default class StaffNotes extends React.Component {
  static propTypes = {
    keySignature: types.object.isRequired,
    noteWidth: types.number.isRequired,
    notes: types.array.isRequired,

    upperRow: types.number.isRequired,
    lowerRow: types.number.isRequired,
    heldNotes: types.object.isRequired,
    inGrand: types.bool,
    staffClass: types.string,
    noteShaking: types.bool,
  }

  render() {
    let [songNotes, noteClasses] = this.convertToSongNotes()
    let heldSongNotes = this.convertHeldToSongNotes()

    // TODO: annotations are missing

    let count = Math.abs(this.props.keySignature.count)
    let keySignatureWidth = count > 0 ? count * 20 + 20 : 0;

    return <div ref="notes" className={this.classNames()}>
      <LedgerLines key="ledger_lines"
        offsetLeft={keySignatureWidth}
        upperRow={this.props.upperRow}
        lowerRow={this.props.lowerRow}
        notes={songNotes}
        pixelsPerBeat={this.props.noteWidth}
      />

      <WholeNotes key="notes"
        offsetLeft={keySignatureWidth}
        keySignature={this.props.keySignature}
        upperRow={this.props.upperRow}
        lowerRow={this.props.lowerRow}
        notes={songNotes}
        noteClasses={noteClasses}
        pixelsPerBeat={this.props.noteWidth}
      />

      <WholeNotes key="held_notes"
        offsetLeft={keySignatureWidth}
        keySignature={this.props.keySignature}
        upperRow={this.props.upperRow}
        lowerRow={this.props.lowerRow}
        notes={heldSongNotes}
        staticNoteClasses="held"
        pixelsPerBeat={this.props.noteWidth}
      />
    </div>
  }

  convertHeldToSongNotes() {
    if (!this.props.heldNotes) {
      return null
    }

    let notes = new SongNoteList()

    // notes that are held down but aren't correct
    Object.keys(this.props.heldNotes)
      .filter((note) => !this.props.notes.inHead(note))
      .forEach((note, idx) => {
        notes.push(new SongNote(note, 0, 1))
      })

    return notes
  }

  convertToSongNotes() {
    let notes = new SongNoteList()
    let beat = 0
    let dur = 40 / this.props.noteWidth

    let noteClasses = {}

    let toRow = n =>
      noteStaffOffset(this.props.keySignature.enharmonic(n))

    let appendClass = (note, cls) => {
      if (noteClasses[note.id]) {
        noteClasses[note.id].push(cls)
      } else {
        noteClasses[note.id] = [cls]
      }
    }

    this.props.notes.forEach((column, columnIdx) => {
      let withClasses = (note) => {
        if (columnIdx == 0) {
          if (this.props.noteShaking) {
            appendClass(note, "noteshake")
          }

          if (this.props.heldNotes[note.note]) {
            appendClass(note, "held")
          }
        }

        return note
      }

      if (Array.isArray(column)) {
        let tuples = column.map(n =>
          [toRow(n), n]
        )

        let lastRow = null
        let offset = 0
        tuples.forEach(([row, n]) => {
          if (lastRow && Math.abs(lastRow - row) == 1) {
            if (offset == 0) {
              offset = 1
            } else {
              offset = 0
            }
          } else {
            offset = 0
          }

          let sNote = new SongNote(n, beat, dur)

          if (offset == 1) {
            appendClass(sNote, "group_offset")
          }

          lastRow = row
          notes.push(withClasses(sNote))
        })

      } else {
        notes.push(withClasses(new SongNote(column, beat, dur)))
      }

      beat += 1
    })

    return [notes, noteClasses]
  }

  classNames()  {
    return "staff_notes"
  }

  setOffset(amount) {
    this.refs.notes.style.transform = `translate3d(${amount}px, 0, 0)`;
  }

  // TODO: move this out
  shouldRenderPitch(pitch) {
    const props = this.props

    if (props.inGrand) {
      switch (props.staffClass) {
        case "f_staff":  // lower
          if (pitch >= MIDDLE_C_PITCH) {
            return false
          }
          break;
        case "g_staff":  // upper
          if (pitch < MIDDLE_C_PITCH) {
            return false
          }
          break;
      }
    }

    return true
  }
}
