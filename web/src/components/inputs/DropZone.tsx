import * as React from "react";
import RDZ from "react-dropzone";
import "./DropZone.css";

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// File manager, with drag&drop
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

interface Props {
  handleOnDrop: (accepted: Array<File>, rejected: Array<File>) => void;
}

export default function DropZone(props: Props) {
  let dropzoneRef: RDZ | null;

  return (
    <div className="DropZone">
      <RDZ
        className="dropzone"
        disableClick={true}
        ref={node => {
          dropzoneRef = node;
        }}
        onDrop={props.handleOnDrop}
      >
        <p>Drop files here.</p>
        <button
          type="button"
          onClick={() => {
            if (dropzoneRef !== null) {
              dropzoneRef.open();
            }
          }}
        >
          Browse Files
        </button>
      </RDZ>
    </div>
  );
}
