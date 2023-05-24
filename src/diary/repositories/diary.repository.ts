import { ConsoleLogger, Injectable, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CustomRepository } from 'src/common/custom-repository.decorator';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateDiaryDto } from '../dtos/update-diary.dto';
import { Diary } from '../entities/diary.entity';

@Injectable()
@CustomRepository(Diary)
export class DiarysRepository {
  constructor(
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async getAllDiary(userId, date) {
    try {
      const query = await this.diaryRepository
        .createQueryBuilder('diary')
        .where(`diary.date LIKE :datePattern`, { datePattern: `${date}-%` })
        .andWhere(`diary.userId = :userId`, { userId })
        .orderBy({ diary_id: 'DESC' })
        .getMany();

      if (!query) {
        return 'You dont have diary';
      }
      return query;
    } catch (error) {
      console.error(error, 'Failed get diaries');
    }
  }

  /**
   *
   * @param diaryId
   * @param userId
   * @returns
   */

  async getDiary(diaryId, userId) {
    try {
      const diary = await this.diaryRepository.findOneBy({
        diary_id: diaryId,
        user: { id: userId }
      });

      if (!diary) {
        return 'You dont have diary';
      }
      return diary;
    } catch (error) {
      return false;
    }
  }

  async createDiary({ title, content, emotion, weather, date, userId }): Promise<Diary | string> {
    try {
      // const user = await this.userRepository.findOneBy({ id: userId });
      console.log('createDiary 1111');

      const findDiary = await this.verifyDiary(date, userId);

      console.log('다이어리는 : ', findDiary);
      if (findDiary.length == 1) {
        return '이미 오늘 작성한 일기가 있습니다';
      }

      const diary = await this.diaryRepository.save({
        title,
        content,
        emotion,
        weather,
        date,
        userId
      });
      console.log(diary);

      return diary;
    } catch (error) {
      // return false;
      throw new Error('error');
    }
  }

  async verifyDiary(date: string, userId) {
    const findDiary = await this.diaryRepository.find({ where: { user: { id: userId }, date } });

    return findDiary;
  }

  async updateDiary(diary_id, updateDiaryDto: UpdateDiaryDto, userId) {
    try {
      const diary = await this.diaryRepository.update(
        { diary_id, userId },
        { source: null, ...updateDiaryDto }
      );

      if (!diary) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async deleteDiary({ diaryId, userId }) {
    const deleteDiary = await this.diaryRepository.delete({
      diary_id: diaryId,
      user: { id: userId }
    });
    if (deleteDiary.affected === 0) {
      return false;
    }
    return deleteDiary;
  }

  // async getDiaryList({ userId }) {
  //   // user의 전체 다이어리 리스트를 보여주면 됨.
  //   const getDiaryList = await this.diaryRepository.findOne({});
  // }

  async getCalendarDiary(userId) {
    // miniCalendar
    console.log(userId);
    const getUserDiary = await this.diaryRepository.findBy({ user: { id: userId } });

    if (getUserDiary.length != 0) {
      // not empty
      let returnArr = [];
      let sortingArr = []; // 정렬해서 보내줄
      getUserDiary.map(e => {
        // sortingArr.push(Number(e.date.split('-')[2]));
        returnArr.push({ id: e.diary_id, date: e.date });
      });
      // returnArr.sort((a, b) => a.id - b.id);

      // console.log(returnArr);
      return returnArr;
    } else {
      return { ok: false, message: '작성한 글이 없습니다.' };
    }
  }

  async saveImage(diary_id: number, source: string) {
    console.log('diary_id : ', diary_id);
    console.log('source : ', source);
    await this.diaryRepository.update(diary_id, { source });
  }

  async saverRating(rate: number, diary_id: number) {
    try {
      console.log('rate : ', rate);
      var a = await this.diaryRepository.update(diary_id, { rate });
      console.log(a);
      return 'true';
    } catch (error) {
      console.log(error);
      return 'false';
    }
  }
  // async saveWeather(id: number, weather: string) {
  //   await this.diaryRepository.update(id, { weather });
  // }
}
