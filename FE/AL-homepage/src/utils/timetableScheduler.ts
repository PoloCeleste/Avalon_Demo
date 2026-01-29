const DAYS = ["월", "화", "수", "목", "금"];
const ROOMS = [...Array(12).keys()].map(i => `${i+1}호`);

type ClassInput = [string, string, number, number, number]; // [요일, 클래스룸(호실), 타임, 수업ID, class_id]
type Assignment = [string, string, number, number, number, string | null]; // [요일, 클래스룸(호실), 타임, 수업ID, class_id, status]
type TeacherCapacities = { [teacherId: number]: number };
type TeacherDaySchedule = { [time: number]: boolean };
type TeacherAssignments = { [teacherId: number]: Assignment[] };
type TeacherDayTime = { [teacherId: number]: { [day: string]: TeacherDaySchedule } };

export class TeacherScheduler {
    private numTeachers: number;
    private classes: ClassInput[];
    private teacherCapacities: TeacherCapacities;
    private assignments: TeacherAssignments;
    private teacherDayTime: TeacherDayTime;

    constructor(numTeachers: number, classes: ClassInput[], teacherCapacities: TeacherCapacities) {
        this.numTeachers = numTeachers;
        this.classes = classes;
        this.teacherCapacities = teacherCapacities;
        this.assignments = {};
        this.teacherDayTime = {};

        for (let i = 0; i < numTeachers; i++) {
            this.assignments[i] = [];
            this.teacherDayTime[i] = {};
            DAYS.forEach(day => {
                this.teacherDayTime[i][day] = {}; // 시간별 수업 여부 저장
            });
        }
    }

    private countConsecutive(scheduleDay: TeacherDaySchedule): number {
        let maxConsec = 0, current = 0;
        for (let t = 1; t <= 8; t++) { // 8타임
            if (scheduleDay[t]) {
                current++;
                if (current > maxConsec) maxConsec = current;
            } else {
                current = 0;
            }
        }
        return maxConsec;
    }

    private canAssign(teacherId: number, day: string, time: number): { can: boolean, status: string | null } {
        const daySchedule = this.teacherDayTime[teacherId][day];
        daySchedule[time] = true; // 임시 추가
        const maxConsec = this.countConsecutive(daySchedule);

        if (maxConsec >= 6) {
            delete daySchedule[time];
            return { can: false, status: "위험" };
        }
        const status = maxConsec === 5 ? "경고" : null;
        return { can: true, status };
    }

    public assign(): TeacherAssignments {
        // 수업을 요일, 클래스룸, 타임 기준 정렬
        const classesSorted = this.classes.slice().sort((a, b) => {
            return DAYS.indexOf(a[0]) - DAYS.indexOf(b[0]) ||
                   ROOMS.indexOf(a[1]) - ROOMS.indexOf(b[1]) ||
                   a[2] - b[2];
        });

        for (const cls of classesSorted) {
            const [day, room, time, curriDetailId, classId] = cls;
            // 선생님별 반 사용 수와 수업 수 계산 후 정렬
            const load: [number, number, number][] = []; // [teacherId, roomsUsedCount, assignmentsCount]
            for (let t = 0; t < this.numTeachers; t++) {
                const roomsUsed = new Set(this.assignments[t].map(c => c[1]));
                load.push([t, roomsUsed.size, this.assignments[t].length]);
            }
            load.sort((a, b) => (a[1] - b[1]) || (a[2] - b[2]));

            let assigned = false;
            for (const [t] of load) {
                // 선생님의 할당량을 초과하는지 확인
                if (this.teacherCapacities && this.assignments[t].length >= this.teacherCapacities[t]) {
                    continue; // 할당량 초과 시 다음 선생님 시도
                }

                const {can, status} = this.canAssign(t, day, time);
                if (can) {
                    this.assignments[t].push([day, room, time, curriDetailId, classId, status]);
                    // 확정 반영
                    this.teacherDayTime[t][day][time] = true;
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                throw new Error(`할당 불가능한 수업 존재: ${day} ${room} 타임${time} 수업ID${curriDetailId} 반ID${classId}`);
            }
        }
        return this.assignments;
    }
}