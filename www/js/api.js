'use strict';

var classes = [
    "1-ИИвЭ/WI",
    "1-Марк/Mark",
    "1-Мен(В/В)/1-Man",
    "1-Мен(МA)/1Man(МA)",
    "1-Мен/Man",
    "1-Рег(MA)/УВР/Reg/IWM(MA)",
    "1-ТМ/Tel",
    "1-Фин(В/В)/1-Fin",
    "1-Фин/Fin",
    "1-ЭЭТ/EUT", "1А-МО/A IB",
    "1А-ТЛ/A VL",
    "1Б-МО/B IB", "1Б-ТЛ/B VL",
    "1Л (МА)/L(MA)",
    
    "2-Марк/Mark",
    "2-Мен(MA)/2Man(MA)",
    "2-Мен(В/В)/2-Man", "2-Мен/Man", "2-МО/IB", "2-Рег/УВР(MA)/Reg/IWM(MA)",
    "2-ТМ/Tel", "2-Фин(MA)/2Fin(MA)", "2-Фин(В/В)/2-Fin", "2-Фин/Fin",
    "2-ЭИ/WI", "2-ЭЭТ/EUT", "2А-ТЛ/A VL", "2Б-ТЛ/B VL",
    
    "3-Мар/Mark", "3-Марк(В/В)/3-Mark", "3-Мен/Man", "3-МО/ IB", "3-ТЛ/ VL",
    "3-ТМ/Tel", "3-Фин(В/В)/3-Fin", "3-Фин/Fin", "3-ЭИ/WI", "3-ЭЭТ/EUT",
    "4-Мар/Mark", "4-Мен/Man", "4-ТМ/Tel", "4-Фин/Fin", "4-ЭИ/WI",
    "4-ЭЭТ/EUT", "4А-МО/A IB", "4А-ТЛ/A VL", "4Б-МО/B IB", "4Б-ТЛ/B VL",
    "Адм", "Курсы", "ЯК"];


function extractTranscriptionMap(transcriptionTable) {
    var result = {};
    $(transcriptionTable).find("tr").each(function (index, rowElement) {
        if (index === 0) {
            return;
        }

        var shortName = rowElement.children[0].innerText.trim();
        var longName = rowElement.children[1].innerText.trim();
        result[shortName] = longName;
    });
    return result;
}

function extractLectionData(lectionElement) {
    var lectionCells = $(lectionElement).find("tr").children("td");
    if (lectionCells.length < 4) {
        // If we don't have enough information then return null.
        // this will means that no lection is here.
        return null;
    }

    var startTime = lectionCells[0].innerText.trim();
    var lessonCode = lectionCells[1].innerText.trim();
    if (lessonCode.indexOf('*') == 0) {
        lessonCode = lessonCode.slice(1);
    }

    var teacherCode = lectionCells[2].innerText.trim();
    var room = null;
    if (lectionCells.length === 5) {
        room = lectionCells[3].innerText.trim();
    }

    var endTime = lectionCells[lectionCells.length - 1].innerText.trim();
    var lectionInformation = {
        startTime: startTime,
        lessonCode: lessonCode,
        teacherCode: teacherCode,
        room: room,
        endTime: endTime
    };
    return lectionInformation;
}

function extractLessons(lessonsTable) {
    var result = [];
    for (var i = 0; i<6;i++) {
        result.push([]);
    }

    var dataRows = $(lessonsTable).children("tbody").children("tr:odd");
    dataRows.each(function (lectureIndex, element) {
        var colspanTotal = 0;
        var dayIndexOffset = 0;
        var lectionsData = [];
        $(element).children("td").each(function (dayIndex, element) {
            if (dayIndex === 0) {
                return;
            }

            var lectionElement = extractLectionData(element);
            if (lectionElement !== null) {
                lectionsData.push(lectionElement);
            }

            var colSpan = element.getAttribute("colspan") || 1;
            colspanTotal += parseInt(colSpan);
            if (colspanTotal < 12) {
                dayIndexOffset--;
                return;
            }

            var lecturesCount = parseInt(element.getAttribute("rowspan")) / 2;
            //console.log(element, lecturesCount);
            var currentDayIndex = dayIndex;
            var dayData = result[currentDayIndex - 1 + dayIndexOffset];
            if (dayData == null) {
                console.log(result);
            }
            while(dayData.length > lectureIndex) {
                dayData = result[currentDayIndex - 1 + dayIndexOffset];
                currentDayIndex++;
            }

            for (var i = 0; i < lecturesCount; i++){
                dayData.push(lectionsData);
            }

            colspanTotal = 0;
            lectionsData = [];
        });
    });
    return result;
}

function decodeLessonCodes(lessons, map) {
    lessons.forEach(function (dayOfWeek) {
        dayOfWeek.forEach(function (lessonsList) {
            lessonsList.forEach(function (lesson) {
                lesson.lesson = map[lesson.lessonCode];
                lesson.teacher = map[lesson.teacherCode];
            });
        });
    });
}

var api = {
    /**
    * Get list of courses
    */
    getCourses: function () {
        return [
            { courseId: 1, name: '1 курс', prefix: 1, isMagister: false },
            { courseId: 2, name: '2 курс', prefix: 2, isMagister: false },
            { courseId: 3, name: '3 курс', prefix: 3, isMagister: false },
            { courseId: 4, name: '4 курс', prefix: 4, isMagister: false },
            
            { courseId: 5, name: '1 курс', prefix: 1, isMagister: true },
            { courseId: 6, name: '2 курс', prefix: 2, isMagister: true }
        ];
    },
    /**
    * Get list of groups for the given course
    * @param courseId {Number} Id of the course for which get array of groups.
    * @returns Associative array with groups from `classes` var. 
    */
    getGroups: function (courseId) {
        var courses = this.getCourses(),
            course = courses[courseId - 1],
            index,
            className,
            groups = [];
        if (course === undefined) {
            throw new Error("Invalid courseId");
        }
        
        for (index in classes) {
            className = classes[index];
            
            // The class name should start with course prefix. 
            if (className.indexOf(course.prefix.toString()) === 0) {
                if (course.isMagister) {
                    // Magister courses should contains (МА) string
                    if (className.indexOf("(MA)") !== -1 || className.indexOf("(МA)") !== -1) {
                        groups.push({ id: index, name: className });
                    }
                } else {
                    // Magister courses should NOT contains (МА) string
                    if (className.indexOf("(MA)") === -1 && className.indexOf("(МA)") === -1) {
                        groups.push({ id: index, name: className });
                    }
                }
            }
        }
        
        return groups;
    },
    getGroupName(groupId) {
        return classes[groupId];
    },
    getLecturesTime: function (lesson, lessonsData) {
        var lessonsList = lessonsData[lesson];
        if (lessonsList == null || lessonsList.length == 0) {
            return null;
        }

        return { start: lessonsList[0].startTime, end: lessonsList[0].endTime };
    },
    getLessons: function (weekNumber, groupId) {
        var groupCode = Array(5).join("0") + (parseInt(groupId) + 1);
        groupCode = groupCode.slice(groupCode.length - 5);
        var url = 'http://dku.kz/timetable/' + weekNumber + '/c/c' + groupCode + '.htm';
        return axios.get(url)
          .then(function (response) {
            var centerElement = $(response.data).filter("center");
            var innerTables = $(centerElement).children("table");
            var tableWithLessons = innerTables[0];
            var transcription = innerTables[1];
            var lessons = extractLessons(tableWithLessons);
            var transcriptionMap = extractTranscriptionMap(transcription);
            decodeLessonCodes(lessons, transcriptionMap);
            return {
                lessons: lessons,
                map: transcriptionMap
            }
          });
    }
};
