// Globals
const schedule_index = 7;
const max_days = 6;
const max_hours = 18;
const first_day = 2;
const last_day = 7;

// Read and Write interface with DOM


class SubjectClass {
    constructor(id, checkbox) {
        this.id = id;
        this.checkbox = checkbox;
        this.schedule_code = this.get_schedule();
        this.schedule_matrix = this.create_schedule_matrix();
    }


    get_schedule() {
        const table_row = this.checkbox.closest("tr");
        const table_cells = table_row.querySelectorAll("td");

        return table_cells[schedule_index].textContent;
    }


    create_schedule_matrix() {
        let matrix = Array.from({length: max_days}, () => new Array(max_hours).fill(0));
        const schedule_codes = this.schedule_code.split(/\s+/);

        for (const code of schedule_codes) {
            console.log(code);
            let index = 0;
            let days = [];
            let shift;

            while (index < code.length) {
                if (code[index] >= first_day && code[index] <= last_day) {
                    days.push(code[index] - first_day);
                    index++;
                }
                else break;
            }
            
            if (code[index] == 'M') shift = 0;
            else if (code[index] == 'T') shift = 1;
            else if (code[index] == 'N') shift = 2;
            else continue;

            index++;
            while (index < code.length) {
                let hour  = code[index]
                if (hour >= 1 && hour <= 6) {
                    hour = (hour - 1) + (shift * 6);
                    for (const day of days) {
                        matrix[day][hour] = 1;
                    }
                    index++;
                }
                else break;
            }
        }

        return matrix;
    }


    causes_conflict(other_subject) {
        for (let i = 0; i < max_days; i++) {
            for (let j = 0; j < max_hours; j++) {
                if (this.schedule_matrix[i][j] == 1 && other_subject.schedule_matrix[i][j] == 1) {
                    return true;
                }
            }
        }
        
        return false;
    }
}


class SigaaInterface {
    constructor() {
        this.all_subjects = [];
        this.selected_subjects = [];
        this.unique_id = 0;
        this.table = this.get_table();
        this.create_listeners();
    }


    get_table() {
        const checkboxes = document.querySelectorAll("input[name=\"selecaoTurmas\"");

        if (checkboxes.length > 0) {
            return checkboxes[0].closest("table");
        }

        console.log("Checkboxes have returned null")
    }

    create_message_node(checkbox) {
        const parent = checkbox.parentNode;
        const label = document.createElement("label");

        label.classList.add("conflito");
        parent.appendChild(label);
    }


    update_message(checkbox, positive) {
        const parent = checkbox.parentNode;
        const label = parent.querySelector(".conflito");

        if (label != null) {
            if (positive) {
                label.textContent = "\u2713";
                label.title = "sem conflitos de horário";
                label.style.color = "green";
            }
            else {
                label.textContent = "\u274c";
                label.title = "com conflitos de horário";
                label.style.color = "red";
            }
        }
    }


    update_conflicts() {
        for (const subject of this.all_subjects) {
            let positive = true;

            for (const selected of this.selected_subjects) {
                if (subject != selected) {
                    if (subject.causes_conflict(selected)) {
                        positive = false;
                        break;
                    }
                }
            }

            this.update_message(subject.checkbox, positive);
        }
    }


    select_subject(checkbox) {
        for (const subject of this.all_subjects) {
            console.log(subject.checkbox);
            if (subject.checkbox === checkbox) {
                this.selected_subjects.push(subject);
                break;
            }
        }

        this.update_conflicts();
    }


    unselect_subject(checkbox) {
        for (let index = 0; index < this.selected_subjects.length; index++) {
            if (this.selected_subjects[index].checkbox === checkbox) {
                this.selected_subjects.splice(index, 1);
            }
        }

        this.update_conflicts();
    }

    create_listeners() {
        const checkboxes = this.table.querySelectorAll("input[type=\"checkbox\"");

        for (const checkbox of checkboxes) {
            this.all_subjects.push(new SubjectClass(this.unique_id++, checkbox));
            this.create_message_node(checkbox);

            checkbox.addEventListener("change", (event) => {
                if(event.target.checked) {
                    this.select_subject(event.target);
                }
                else {
                    this.unselect_subject(event.target);
                }
            });
        }
    }
}


const sigaa_interface = new SigaaInterface();