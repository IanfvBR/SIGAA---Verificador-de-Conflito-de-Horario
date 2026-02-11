(function() {
/* conflict-manager.js */

/*
 * Author: ianfvBR
 * Name: conflict-manager
 */


/* This script contains the Schedule, Subject, Timetable and ConflictManager
 * classes and their methods. It's main purpose is to check for conflicting schedules
 * between multiple subjects. */


// Global constants used in the script
const FIRST_DAY = '2'; //Monday
const LAST_DAY = '7'; //Saturday
const MORNING_SHIFT = 'M';
const AFTERNOON_SHIFT = 'T';
const NIGHT_SHIFT = 'N';
const FIRST_HOUR = '1';
const LAST_HOUR = '6';

// This class receives the schedule code string (default: [days][shift][hours], eg.: 24M56) and
// stores it in days array, shift variable and hours array.
class Schedule {
    constructor(code) {
        this.code = code.toUpperCase();
        this.days = [];
        this.shift;
        this.hours = [];
        this.is_valid = true;
        this.translate_code();
    }


    // Translate the schedule code string into easier to handle data
    translate_code() {
        let index = 0;

        while (index < this.code.length && 
            this.code[index] >= FIRST_DAY && this.code[index] <= LAST_DAY) {

            this.days.push(parseInt(this.code[index], 10));
            index++;
        }

        if (index < this.code.length && this.code[index] == MORNING_SHIFT) this.shift = 1;
        else if (this.code[index] == AFTERNOON_SHIFT) this.shift = 2;
        else if (this.code[index] == NIGHT_SHIFT) this.shift = 3;
        else this.is_valid = false;

        index++;
        while (index < this.code.length && 
            this.code[index] >= FIRST_HOUR && this.code[index] <= LAST_HOUR) {

            this.hours.push(parseInt(this.code[index], 10));
            index++
        }

        if (index < this.code.length) this.is_valid = false;
    }


    // If two schedules occur in the same shift, same day and same hour, return true.
    causes_conflict(other_schedule) {
        if (this.is_valid) {
            if (this.shift == other_schedule.shift) {
                for (const day of this.days) {
                    if (other_schedule.days.includes(day)) {
                        for (const hour of this.hours) {
                            if (other_schedule.hours.includes(hour)) return true;
                        }
                    }
                }
            }
            
            return false;
        }

        return true;
    }
}


// This class receives strings containing the name, number (in case there's more than one class
//  for the same subject), and an instance of Schedule.
class Subject {
    constructor(name, number, schedule) {
        this.name = name;
        this.number = parseInt(number, 10);
        this.schedule = schedule;
    }


    // Check for conflict between subjects. Is it the same subject?
    // Do their schedules conflict?
    causes_conflict(other_subject) {
        if (this.name != other_subject.name) {
            return this.schedule.causes_conflict(other_subject.schedule);
        }

        return true; // Same subject
    }
}


// The timetable formats a list of subjects into a matrix of strings representing a timetable.
class Timetable {
    constructor(subjects) {
        this.subjects = subjects;
        this.table = [];
        this.initialize_table();
        this.fill_table();
    }


    // table = [hour1, hour2, ...]
    // hour1 = [day1, day2, ...]
    // [[day1, day 2, ...], [day1, day2, ...], ...]
    // hours will be rows, while days will be columns
    initialize_table() {
        const number_of_shifts = 3;
        const blank_timeslot = "------";

        for (let hour = FIRST_HOUR; hour <= LAST_HOUR * number_of_shifts; hour++) {
            const row = [];

            for (let day = FIRST_DAY; day <= LAST_DAY; day++) {
                row.push(blank_timeslot);
            }

            this.table.push(row);
        }
    }


    // Fill the table with the name of the subjects + class number
    fill_table() {
        for (const subject of this.subjects) {
            for (const hour of subject.schedule.hours) {
                for (const day of subject.schedule.days) {
                    this.table[(hour + 6 * (subject.schedule.shift - 1) - FIRST_HOUR)][day - FIRST_DAY] = 
                    `${subject.name} T${subject.number}`;
                }
            }
        }
    }
}


// Stores all desired subjects and uses a backtrack algorithm to generate possible timetables
// without conflicting schedules
class ConflictManager {
    #current_selection = [];

    constructor(subjects) {
        this.all_subjects = subjects;
        this.all_possibilities = [];
    }



    can_insert(new_subject) {
        for (const subject of this.current_selection) {
            if (new_subject.causes_conflict(subject)) {
                return false;
            }
        }

        return true;
    }


    backtrack(size, start = 0) {
        if (this.current_selection.length == size) {
            this.all_possibilities.push(new Timetable(this.current_selection));
            return;
        }

        for (let index = start; index < this.all_subjects.length; index++) {
            if (this.can_insert(this.all_subjects[index])) {
                this.current_selection.push(this.all_subjects[index]);
                this.backtrack(size,start++);
                this.current_selection.pop();
            }
        }
    }


    calculate_possibilities(size) {
        this.current_selection = [];
        this.all_possibilities = [];
        this.backtrack(size);
    }
}

/* ========================================================================================== */
/* content-script.js */

/* TO DO:
 * function to get all checkboxes
 * function to add eventlistener to all checkboxes
 * function to extract data from the table rows and table datas
 * function to process this data, creating a list of all subjects and classes
 * function to handle the change event when a checkbox is changed
 * function to insert selected classes into a list
 * function to remove de-selected classes from the list
 * function to update the conflict flags whenever a checkbox is changed
 */

const all_subjects = create_list_of_all(); // A list of Subject Objects paired with their respective DOM node
const selected_subjects = []; // A list of indexes for the all_subjects list
const class_index = 3;
const schedule_index = 5;
// index 0 is an icon
// index 1 is another icon
// index 2 is the checkbox
// index 4 is the teacher's name


function get_all_checkboxes() {
    return document.querySelectorAll("input[type=\"checkbox\"]");
}


function add_eventlisteners(checkboxes) {
    for (const checkbox of checkboxes) {
        checkbox.addEventListener("change", on_checkbox_changed);
    }
}

let unique_id = 0;
function extract_data(table_row) {
    const name = unique_id++;// Not yet implemented: get_subject_name(table_row);
    const class_number = get_number_inside_string(table_row.cells[class_index].textContent);
    const schedule_code = table_row.cells[schedule_index].textContent;
    const data = [name, class_number, schedule_code];

    return data;
}


function create_list_of_all() {
    const checkboxes = get_all_checkboxes();

    add_eventlisteners(checkboxes);
    for (const checkbox of checkboxes) {
        const table_row = checkbox.parentElement;
        const data = extract_data(table_row);

        all_subjects.push([new Subject(data[0], data[1], new Schedule(data[2]))], table_row);
    }
}


function on_checkbox_changed(event) {
    if (event.target.checked) {
        on_subject_selected(event.target.parentElement);
    }
    else on_subject_deselected(event.target.parentElement);
    update_conflicts();
}


function on_subject_selected(table_row) {
    const data = extract_data(table_row);

    selected_subjects.push(find_index(data[0], data[1]));
}


function on_subject_deselected(table_row) {
    const data = extract_data(table_row);

    remove_subject(find_index(data[0], data[1]));
}


function update_conflicts() {
    for (const current of all_subjects) {
        const subject = current[0];
        let conflict_flag = 0;

        if (subject.schedule.is_valid) {
            for (const index of selected_subjects) {
                const selected = all_subjects[selected][0];

                if (subject != selected) {
                    if (subject.causes_conflict(selected)) {
                        conflict_flag = 1;
                    }
                }
            }
        }
        else conflict_flag = 2;
        insert_conflict_message(current[1], conflict_flag);
    }
}


/* Other functions */


// A schedule code always have a shift character surrounded by numbers 
function is_schedule_code(string, index = 1) {
    if (index + 1 < string.length && index > 0) {
        if ( is_shift(string[index])) {
            if ( is_digit(string[index - 1]) && is_digit(string[index + 1])) {
                return true;
            }
        }

        return is_schedule_code(string, index++);
    }

    return false; // When it reaches the end of string but never returned true
}


function is_shift(character) {
    if (character == MORNING_SHIFT || character == AFTERNOON_SHIFT || character == NIGHT_SHIFT) {
        return true;
    }

    return false;
}


function is_digit(character) {
    if (character >= '0' && character <= '9') return true;

    return false;
}


function get_number_inside_string(string) {
    let number_string = "";
    let flag = false;

    for (const character of string) {
        if (is_digit(character)) {
            number_string += character;
            flag = true;
        }
        else if (flag) break;
    }

    return parseInt(number_string, 10);
}


function get_subject_name(table_row) {
    return "Not Implemented";
}


function find_index(name, number) {
    for (let index = 0; index < all_subjects.length; index++) {
        const subject = all_subjects[index];
        if (subject[0].name == name && subject[0].number == number) {
            return index;
        }
    }

    return NaN;
}


function remove_subject(index) {
    if (index != NaN) {
        const subject = findIndex(element => element == index);
        selected_subjects.splice(subject);
    }
}


function insert_conflict_message(table_row, flag) {
    let message = " ? ";
    const label = document.createElement("label");

    if (flag == 0) message = " sem conflito \u2705";
    else if (flag == 1) message = " com conflito \u274C";
    label.textContent = message;
    table_row.appendChild(label);
}

// End
});