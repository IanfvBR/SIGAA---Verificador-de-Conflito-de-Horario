/*
 * Author: IanfvBR
 * Version: 0.1
 * Github: https://github.com/IanfvBR
 */


// Remove new labels added on previous execution of this script
document.querySelectorAll(".content_script").forEach(element => element.remove());

const POSITIVE_MESSAGE = "\u2713";
const NEGATIVE_MESSAGE = "\u274C"

class Timetable {
    constructor(days, shifts, hours) {
        this.days = days;
        this.shifts = shifts;
        this.hours = hours;
    }

    causes_conflict(other_timetable) {
        for (const day of this.days) {
            if (other_timetable.days.includes(day)) {
                for (const shift of this.shifts) {
                    if (other_timetable.shifts.includes(shift)) {
                        for (const hour of this.hours) {
                            if (other_timetable.hours.includes(hour)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return false;
    }


    static create_timetable_from_timestring(timestring) {
        let days = [];
        let shifts = [];
        let hours = [];
        let index = 0;
        const SUNDAY = "1";
        const SATURDAY = "7";
        const MORNING = "M";
        const AFTERNOON = "T";
        const NIGHT = "N";
        const FIRST_HOUR = "1";
        const LAST_HOUR = "6";


        // Set days
        while (index < timestring.length) {
            let current = timestring[index];

            if (current >= SUNDAY && current <= SATURDAY) {
                days.push(parseInt(current,10));
            }
            else {
                break;
            }
            index++;
        }

        // Set shifts
        while (index < timestring.length) {
            let current = timestring[index].toUpperCase();

            if (current == MORNING || current == AFTERNOON || current == NIGHT) {
                shifts.push(current);
            }
            else {
                break;
            }
            index++;
        }

        // Set hours
        while (index < timestring.length) {
            let current = timestring[index];

            if (current >= FIRST_HOUR && current <= LAST_HOUR) {
                hours.push(parseInt(current,10));
            }
            else {
                break;
            }
            index++;
        }

        return new Timetable(days,shifts,hours);
    }

}

class Subject {
    constructor(name, timetable, element) {
        this.name = name;
        this.timetable = timetable;
        this.label = document.createElement("label");
        this.label.classList.add("content_script");

        element.appendChild(this.label);
    }

    update_message(message) {
        this.label.textContent = message;
        if(message == NEGATIVE_MESSAGE) {
            this.label.style.color = "red";
        }
        else if (message == POSITIVE_MESSAGE) {
            this.label.style.color = "green";
        }
    }
}


class ConflictManager {
    constructor(all_subjects) {
        this.all_subjects = all_subjects;
        this.selection = [];
        this.initialize();
        this.create_box();
    }


    initialize() {
        for (const subject of this.all_subjects) {
            subject.update_message(POSITIVE_MESSAGE);
        }
    }


    create_box() {
        const box = document.createElement("fieldset");
        const legend = document.createElement("legend");
        const output_box = document.createElement("output");

        output_box.id = "content_script_output_box";
        box.style = "float: right; width: 20%;"
        box.id = "content_script";
        legend.textContent = "Disciplinas Selecionadas";

        legend.appendChild(output_box);
        box.appendChild(legend);
    }


    send_to_box(index) {
        const entry = document.createElement("p");
        const name = document.createElement("label");
        const timestring = document.createElement("label");
        const subject = this.all_subjects[index];

        entry.id = `content_script#${index}`;
        name.textContent = subject.name;
        timestring.textContent = `${subject.days.join(""), subject.shifts.join(""), subject.hours.join("")}`
        timestring.style = "float: right;";
        entry.appendChild(name);
        entry.appendChild(timestring);

        document.getElementById("content_script_output_box").appendChild(entry);
    }


    remove_from_box(index) {
        document.getElementById(`content_script#${index}`).remove();
    }

    update_conflicts() {
        for (const subject of this.all_subjects) {
            let zero_conflicts = true;

            for (const index of this.selection) {
                if (!this.selection.includes(this.all_subjects.indexOf(subject))) {
                    console.log(subject.timetable.causes_conflict(this.all_subjects[index].timetable));
                    if (subject.timetable.causes_conflict(this.all_subjects[index].timetable)) {
                        subject.update_message(NEGATIVE_MESSAGE);
                        zero_conflicts = false;
                    }
                }
            }
            if(zero_conflicts) {
                subject.update_message(POSITIVE_MESSAGE);
            }
        }
    }

    has_conflict(key) {
        for (const index of this.selection) {
            if (this.all_subjects[key].timetable.causes_conflict(this.all_subjects[index].timetable)) {
                return true;
            }
        }
        return false;
    }

    select_subject(index) {
        if (!this.selection.includes(index)) {
            if (this.has_conflict(index)) {
                this.all_subjects[index].update_message(NEGATIVE_MESSAGE);
            }
            else {
                this.all_subjects[index].update_message(POSITIVE_MESSAGE);
            }
            this.selection.push(index);
            this.send_to_box(index);
            this.update_conflicts();
        }
    }

    unselect_subject(index) {
        this.selection.splice(index,1);
        this.update_conflicts();
        this.remove_from_box(index);
    }
}



function create_selection_of_all_subjects(lines) {
    let subjects = [];

    lines.forEach(function(line) {
        const elements = line.querySelectorAll("td");
        const element = elements[0];
        const name = element.textContent;
        const timestring = elements[3].textContent;

        const timetable = Timetable.create_timetable_from_timestring(timestring);

        subjects.push(new Subject(name, timetable, element));
    });

    return subjects;
}


function simulate_input(conflict_manager) {
    conflict_manager.select_subject(5);
    conflict_manager.select_subject(10);
    conflict_manager.select_subject(12);
    conflict_manager.select_subject(13);
    conflict_manager.unselect_subject(12);
    
}


function listen_to_user_input(conflict_manager) {
    /* Aguardando o periodo de matrícula/rematrícula para implementar essa função */
}




function main() {
    const lines = document.querySelectorAll(".linhaPar, .linhaImpar");
    const all_subjects = create_selection_of_all_subjects(lines);
    const conflict_manager = new ConflictManager(all_subjects);

    //simulate_input(conflict_manager);
    listen_to_user_input(conflict_manager);
}

main();